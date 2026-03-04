# MobileNet-SSD Model Files

The tailgating detector uses MobileNet-SSD for vehicle detection via OpenCV DNN.

## Download

Place these two files in this directory:

1. **MobileNetSSD_deploy.prototxt**
2. **MobileNetSSD_deploy.caffemodel** (~23 MB)

### Quick download (Linux / Pi):

```bash
cd ~/OnboardRash/hardware/models

# Prototxt (direct GitHub raw — always works)
wget -O MobileNetSSD_deploy.prototxt \
  https://raw.githubusercontent.com/chuanqi305/MobileNet-SSD/master/deploy.prototxt

# Caffemodel via gdown (handles Google Drive redirects)
pip install gdown
gdown --id 0B3gersZ2cHIxRm5PMWRoTkdHdHc -O MobileNetSSD_deploy.caffemodel
```

> **Why not plain `wget` for the caffemodel?**
> Google Drive redirects through a cookie/virus-scan page — `wget` downloads the
> HTML warning page instead of the actual file. `gdown` handles this correctly.

### Alternative: copy from laptop via SCP

If the Pi has no internet at college, download both files on your laptop first,
then transfer:

```powershell
# Run on laptop (PowerShell)
scp "path\to\MobileNetSSD_deploy.prototxt"  ajmal@<PI_IP>:~/OnboardRash/hardware/models/
scp "path\to\MobileNetSSD_deploy.caffemodel" ajmal@<PI_IP>:~/OnboardRash/hardware/models/
```

### Verify download succeeded

```bash
ls -lh ~/OnboardRash/hardware/models/
# MobileNetSSD_deploy.caffemodel should be ~23 MB
# MobileNetSSD_deploy.prototxt   should be ~7 KB
```

## Notes

- The model detects 20 VOC classes. The tailgating detector filters for:
  - Class 6: bus
  - Class 7: car
  - Class 14: motorbike
- If these files are missing, the system falls back to contour-based detection.
