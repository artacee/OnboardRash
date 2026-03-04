"""
Network Setup Helper for OnboardRash Raspberry Pi

Handles:
- WiFi auto-connection to phone hotspot (using saved nmcli profiles)
- Fallback scan for matching SSIDs (e.g. "Galaxy*" open networks)
- USB tethering detection
- Network info discovery (own IP, gateway, SSID, subnet)

Usage:
    python network_setup.py              # standalone — connect + print info
    from network_setup import NetSetup   # import in main_pi.py
"""

import subprocess
import time
import json
import re
import os
import sys


# Default config path (next to this file)
_CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            'network_config.json')


def _run(cmd, timeout=15):
    """Run a shell command, return stdout string (or '' on error)."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=timeout
        )
        return result.stdout.strip()
    except Exception:
        return ''


def _load_config(path=None):
    """Load network_config.json, returning defaults if missing."""
    path = path or _CONFIG_PATH
    defaults = {
        "preferred_ssid": "",
        "preferred_password": "",
        "fallback_ssid_pattern": "Galaxy",
        "fallback_password": "",
        "server_port": 5000,
        "gps_receiver_port": 8081
    }
    try:
        with open(path, 'r') as f:
            cfg = json.load(f)
        # Merge with defaults
        for k, v in defaults.items():
            cfg.setdefault(k, v)
        return cfg
    except FileNotFoundError:
        print(f"⚠️  {path} not found — using defaults")
        return defaults
    except json.JSONDecodeError:
        print(f"⚠️  {path} has invalid JSON — using defaults")
        return defaults


class NetSetup:
    """Discover and optionally establish network connectivity for the Pi."""

    def __init__(self, config_path=None):
        self.config = _load_config(config_path)
        self.info = {
            'connected': False,
            'interface': None,     # 'wlan0' or 'usb0'
            'ssid': None,
            'own_ip': None,
            'gateway': None,
            'subnet': None,
            'method': None,        # 'wifi', 'usb_tether', 'existing'
        }

    # ------------------------------------------------------------------
    #  Public API
    # ------------------------------------------------------------------

    def discover(self):
        """
        Discover current network state without changing anything.
        Populates self.info and returns it.
        """
        # 1. Check USB tethering first (usb0 / usb1)
        usb = self._check_usb_tether()
        if usb:
            self.info.update(usb)
            return self.info

        # 2. Check existing WiFi
        wifi = self._check_wifi()
        if wifi:
            self.info.update(wifi)
            return self.info

        self.info['connected'] = False
        return self.info

    def ensure_connected(self):
        """
        Make sure Pi is online.  Tries in order:
          1. USB tethering (already plugged in)
          2. Existing WiFi connection
          3. Connect to preferred_ssid from config
          4. Scan for fallback SSIDs matching pattern
        Returns self.info dict.
        """
        # Already online?
        self.discover()
        if self.info['connected']:
            return self.info

        # Try preferred SSID
        ssid = self.config.get('preferred_ssid', '').strip()
        pwd = self.config.get('preferred_password', '').strip()
        if ssid:
            print(f"📡 Attempting to connect to '{ssid}'...")
            if self._connect_wifi(ssid, pwd):
                return self.info

        # Scan and try fallback pattern
        pattern = self.config.get('fallback_ssid_pattern', '').strip()
        if pattern:
            print(f"📡 Scanning for networks matching '{pattern}'...")
            matches = self._scan_for_pattern(pattern)
            for match_ssid, match_security in matches:
                pwd_try = '' if 'open' in match_security.lower() else \
                    self.config.get('fallback_password', '')
                print(f"  → Trying '{match_ssid}' ({match_security})...")
                if self._connect_wifi(match_ssid, pwd_try):
                    return self.info

        print("❌ Could not establish network connection")
        self.info['connected'] = False
        return self.info

    def get_server_url_suggestion(self):
        """
        Best-effort guess at the backend server URL.
        If gateway is known, assume laptop is on the same subnet.
        Returns a URL string or None.
        """
        if not self.info.get('gateway'):
            return None
        port = self.config.get('server_port', 5000)
        # The laptop is usually NOT the gateway (that's the phone).
        # We can't know the laptop's IP, but we can suggest the subnet
        # for the user to fill in.
        gw = self.info['gateway']
        return f"http://{gw.rsplit('.', 1)[0]}.???:{port}"

    def print_status(self):
        """Pretty-print current network status."""
        i = self.info
        if not i['connected']:
            print("╔══ Network Status ════════════════════════╗")
            print("║  ❌ NOT CONNECTED                        ║")
            print("╚══════════════════════════════════════════╝")
            return

        method_label = {
            'wifi': '📶 WiFi',
            'usb_tether': '🔌 USB Tethering',
            'existing': '📶 WiFi (pre-connected)',
        }.get(i['method'], i['method'])

        lines = [
            f"  Method:    {method_label}",
            f"  Interface: {i['interface']}",
        ]
        if i['ssid']:
            lines.append(f"  SSID:      {i['ssid']}")
        lines.append(f"  Pi IP:     {i['own_ip']}")
        lines.append(f"  Gateway:   {i['gateway']}")
        if i['subnet']:
            lines.append(f"  Subnet:    {i['subnet']}")

        width = max(len(l) for l in lines) + 4
        print(f"╔══ Network Status {'═' * (width - 19)}╗")
        for l in lines:
            print(f"║{l.ljust(width - 2)}║")
        print(f"╚{'═' * (width - 1)}╝")

    # ------------------------------------------------------------------
    #  Internal helpers
    # ------------------------------------------------------------------

    def _check_usb_tether(self):
        """Check if USB tethering interface (usb0/usb1) is active with an IP."""
        for iface in ('usb0', 'usb1'):
            ip = self._get_ip(iface)
            if ip:
                gw = self._get_gateway(iface)
                return {
                    'connected': True,
                    'interface': iface,
                    'ssid': None,
                    'own_ip': ip,
                    'gateway': gw,
                    'subnet': self._derive_subnet(ip),
                    'method': 'usb_tether',
                }
        return None

    def _check_wifi(self):
        """Check if wlan0 is connected and has an IP."""
        ip = self._get_ip('wlan0')
        if not ip:
            return None
        ssid = _run("nmcli -t -f active,ssid dev wifi | grep '^yes' | cut -d: -f2")
        gw = self._get_gateway('wlan0')
        return {
            'connected': True,
            'interface': 'wlan0',
            'ssid': ssid or '(unknown)',
            'own_ip': ip,
            'gateway': gw,
            'subnet': self._derive_subnet(ip),
            'method': 'existing',
        }

    def _connect_wifi(self, ssid, password=''):
        """Attempt to connect to a WiFi network. Returns True on success."""
        # Check if an nmcli profile already exists for this SSID
        existing = _run(f'nmcli -t -f NAME,UUID connection show | grep -i "^{ssid}:"')
        if existing:
            # Activate existing profile
            result = _run(f'sudo nmcli connection up "{ssid}"', timeout=20)
        elif password:
            result = _run(
                f'sudo nmcli device wifi connect "{ssid}" password "{password}"',
                timeout=20
            )
        else:
            # Open network (no password)
            result = _run(
                f'sudo nmcli device wifi connect "{ssid}"',
                timeout=20
            )

        if 'error' in result.lower() or 'no network' in result.lower():
            print(f"  ✗ Failed to connect to '{ssid}': {result}")
            return False

        # Wait for DHCP assignment
        for _ in range(10):
            time.sleep(1.5)
            ip = self._get_ip('wlan0')
            if ip:
                gw = self._get_gateway('wlan0')
                self.info.update({
                    'connected': True,
                    'interface': 'wlan0',
                    'ssid': ssid,
                    'own_ip': ip,
                    'gateway': gw,
                    'subnet': self._derive_subnet(ip),
                    'method': 'wifi',
                })
                print(f"  ✓ Connected to '{ssid}' — IP {ip}")
                return True

        print(f"  ✗ Connected to '{ssid}' but no IP assigned (DHCP timeout)")
        return False

    def _scan_for_pattern(self, pattern):
        """
        Scan WiFi networks and return [(ssid, security), ...] matching pattern.
        Sorted by signal strength (strongest first).
        """
        _run('nmcli device wifi rescan', timeout=10)
        time.sleep(3)
        raw = _run('nmcli -t -f SSID,SECURITY,SIGNAL device wifi list')
        matches = []
        for line in raw.splitlines():
            parts = line.split(':')
            if len(parts) >= 3:
                ssid, security, signal = parts[0], parts[1], parts[2]
                if ssid and re.search(pattern, ssid, re.IGNORECASE):
                    try:
                        sig = int(signal)
                    except ValueError:
                        sig = 0
                    matches.append((ssid, security, sig))
        # Sort by signal descending
        matches.sort(key=lambda x: x[2], reverse=True)
        return [(m[0], m[1]) for m in matches]

    @staticmethod
    def _get_ip(iface):
        """Get the first IPv4 address for an interface, or None."""
        raw = _run(f'ip -4 -o addr show {iface}')
        match = re.search(r'inet (\d+\.\d+\.\d+\.\d+)', raw)
        return match.group(1) if match else None

    @staticmethod
    def _get_gateway(iface):
        """Get default gateway for an interface, or None."""
        raw = _run(f'ip route show default dev {iface}')
        match = re.search(r'via (\d+\.\d+\.\d+\.\d+)', raw)
        return match.group(1) if match else None

    @staticmethod
    def _derive_subnet(ip):
        """Derive /24 subnet string from IP (e.g. '192.168.43.x')."""
        if not ip:
            return None
        parts = ip.rsplit('.', 1)
        return f"{parts[0]}.0/24" if len(parts) == 2 else None


# ------------------------------------------------------------------
#  Standalone mode — run directly to test / connect
# ------------------------------------------------------------------

def main():
    """Standalone: attempt connection and print status."""
    print("━" * 50)
    print("  OnboardRash — Pi Network Setup")
    print("━" * 50)
    net = NetSetup()
    net.ensure_connected()
    print()
    net.print_status()

    suggestion = net.get_server_url_suggestion()
    if suggestion:
        print(f"\n  💡 Server URL hint: {suggestion}")
        print("     (Replace ??? with the laptop's last IP octet)")
    print()


if __name__ == '__main__':
    main()
