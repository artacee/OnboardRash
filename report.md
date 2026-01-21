# REAL-TIME ONBOARD RASH DRIVING DETECTION

# SYSTEM FOR PUBLIC BUSES

```
A PROJECT REPORT submitted by
```
```
Aaron Tom Varghese (TK122CS004)
Ajmal Mohammed N (TK122CS016)
Adithyan S Anil (TK122CS013)
Noel Johnson (TK122CS060)
```
```
to
```
```
the APJ Abdul Kalam Technological University
```
in partial fulfillment of the requirements for the award of the Degree of Bachelor of
Technology in

```
Computer Science and Engineering
```
```
Department of Computer Science and Engineering
TKM Institute of Technology
Karuvelil, Kollam
```
##### OCTOBER 2025


### DECLARATION

```
We, the undersigned, hereby declare that the project report entitled “Real-Time Onboard
```
Rash Driving Detection System for Public Buses”, submitted in partial fulfillment of the re-

quirements for the award of the degree of Bachelor of Technology of the APJ Abdul Kalam
Technological University, Kerala, is a bonafide work done by us under the supervision of Ms.

Revathy N. This submission represents our ideas in our own words, and where ideas or words

of others have been included, we have adequately and accurately cited and referenced the orig-
inal sources. We also declare that we have adhered to the ethics of academic honesty and

integrity, and have not misrepresented or fabricated any data, idea, fact, or source in this sub-

mission. We understand that any violation of the above will be a cause for disciplinary action
by the institute and/or the University and can also evoke penal action from the sources which

have not been properly cited or from whom proper permission has not been obtained. This

report has not been previously formed as the basis for the award of any degree, diploma, or
similar title of any other University.

Place: Kollam

```
Aaron Tom Varghese
Ajmal Mohammed N
Adithyan S Anil
Noel Johnson
```

##### TKM INSTITUTE OF TECHNOLOGY, KARUVELIL, KOLLAM

##### DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING

### CERTIFICATE

This is to certify that the report entitled “Real-Time Onboard Rash Driving Detection
System for Public Buses” submitted by Ajmal Mohammed N, Aaron Tom Varghese, Adithyan
S Anil, Noel Johnson to the APJ Abdul Kalam Technological University in partial fulfillment
of the requirements for the award of the degree of Bachelor of Technology in Computer Science
and Engineering is a bonafide record of the project work carried out by them under our guid-
ance and supervision. This report in any form has not been submitted to any other University
or Institute for any purpose.

```
Ms. Revathy N Dr. Reji Ravi Mr. Rupesh Ravi Dr. Nijil Raj N
Project Guide Project Coordinator Project Coordinator Head of Department
```

### ACKNOWLEDGEMENT

```
First of all we thank God Almighty for helping us to successfully complete our projectwork.
```
We express our sincere thanks and a deep sense of humble gratitude to the Principal of this

institution, Dr. Gouri Mohan L, for providing all the necessary facilities. We thank Dr.
Nijil Raj N, Head of the Department, Computer Science and Engineering,for all the words

of inspiration.Next we would like to thank our project coordinators Dr. Reji Ravi and Mr.

Rupesh Ravi for their valuable advices. We have great pleasure to express our deep sense of
gratitude and obligation to our project guide Ms. Revathy N for her valuable guidance and

suggestions throughout the entire project work. Last but certainly not the least, we would also

like to thank all faculty and staff of the Department of Computer Science and Engineering and
our friends for their help and co-operation.

```
TKI22CS004 Aaron Tom Varghese
TKI22CS013 Adithyan S Anil
TKI22CS016 Ajmal Mohammed N
TKI22CS060 Noel Johnson
```

# ABSTRACT

Road safety remains a paramount global concern, with nations like India experiencing a dispro-
portionately high number of road accidents and fatalities. While existing traffic laws address
overt violations, a significant portion of accidents stem from rash driving behaviors that, while
not always illegal, inherently increase risk. This report details the design and development of
an onboard, real-time system for public buses aimed at proactively identifying such behaviors.
The proposed system integrates a multi-sensor suite comprising Inertial Measurement Units
(IMU), proximity sensors (radar, LiDAR, ultrasonic), camera vision systems, and Global Po-
sitioning System (GPS). It leverages advanced sensor fusion techniques and machine learning
algorithms for robust detection of unsafe overtaking, close proximity driving (tailgating), and
aggressive maneuvers. Processed on a high-performance edge computing platform, the system
is engineered to generate instant alerts, including video snippets and GPS data, which are then
transmitted to traffic authorities in real-time.
The implementation provides a pragmatic approach for university-level projects, utilizing
cost-effective components such as Raspberry Pi 5 with AI Kit, MPU-6050 IMU, HC-SR
ultrasonic sensors, and Waveshare SIM7600G-H 4G HAT. The system employs sophisticated
algorithms including YOLO for object detection, Extended Kalman Filters for sensor fusion,
and LSTM networks for behavior classification.
Results demonstrate the feasibility of detecting rash driving behaviors through intelligent
sensor fusion and machine learning approaches. The system successfully identifies aggressive
maneuvers, tailgating, and unsafe overtaking while maintaining cost-effectiveness and real-
time performance. This comprehensive framework offers a viable solution for enhancing pub-
lic transport safety by enabling timely intervention against risky driving patterns.

Keywords: Rash driving detection, sensor fusion, edge computing, machine learning, pub-
lic bus safety, real-time monitoring

```
i
```

### MAPPING WITH PROGRAM OUTCOMES (POs)

The mapping between the project contributions and relevant POs is summarized below.

```
PO Contribution of the Project
PO1: Engineering
Knowledge
```
```
Applied fundamental engineering principles in sensor technol-
ogy, embedded computing, and real-time systems for developing
an intelligent driver monitoring solution.
PO2: Problem
Analysis
```
```
Analyzed rash driving patterns and behaviors that elevate col-
lision risk in public transport systems, identifying the need for
proactive monitoring beyond legal violations.
PO3: Design/De-
velopment of So-
lutions
```
```
Designed a comprehensive multi-sensor onboard system inte-
grating IMU, camera, proximity sensors, and GPS with ad-
vanced ML algorithms for real-time detection of unsafe driving
behaviors.
PO5: Modern
Tool Usage
```
```
Utilized modern tools including machine learning (YOLOv8,
TensorFlow Lite), computer vision (OpenCV), sensor fusion
techniques (Extended Kalman Filter), and edge computing plat-
forms.
PO6: The Engi-
neer and Society
```
```
Addressed critical road safety concerns affecting public health,
with focus on enhancing safety of public transport that serves
large volumes of commuters daily.
PO10: Communi-
cation
```
```
Developed real-time MQTT-based alert system with video evi-
dence and GPS data for effective communication with transport
authorities and stakeholders.
Table 0.1: Mapping of Project with Program Outcomes (POs)
```
```
ii
```

### MAPPING WITH SUSTAINABLE DEVELOPMENT GOALS (SDGs)

The project Real-time Onboard System for Public Buses: Detection and Alerting of
Rash Driving Behavior has strong alignment with the United Nations Sustainable Develop-
ment Goals (SDGs). The mapping of the project to the relevant SDGs is presented below.

```
SDG Contribution of the Project
SDG 3: Good
Health and
Well-being
```
```
Target 3.6: Contributes to reducing road traffic deaths and
injuries through proactive detection and alerting of rash
driving behaviors in public transport vehicles.
SDG 9: Indus-
try, Innovation,
and Infrastruc-
ture
```
```
Target 9.1: Promotes reliable and sustainable transport in-
frastructure by implementing innovative edge AI and sensor
fusion technologies for intelligent vehicle monitoring.
```
```
SDG 11: Sus-
tainable Cities
and Communi-
ties
```
```
Target 11.2: Enhances road safety and provides access to
safe, affordable, and accessible transport systems through
real-time monitoring of public bus operations.
```
```
SDG 17: Part-
nerships for the
Goals
```
```
Facilitates collaboration between academic institutions and
transport authorities to develop data-driven solutions for
improving public transport safety and driver training pro-
grams.
Table 0.2: Mapping of Project with Sustainable Development Goals (SDGs)
```
```
iii
```

### FEASIBILITY REPORT

##### TECHNICAL FEASIBILITY

Technical feasibility examines whether the Rash Driving Detection System can be built with
available technology and resources.

1. Hardware Platform
Feasibility: Highly feasible.
Explanation: Raspberry Pi 5 (8GB RAM) with Hailo-8L AI accelerator provides sufficient
processing power for real-time detection. The quad-core CPU handles sensor fusion while the
AI accelerator runs YOLO for vehicle detection.
Solution: Use Raspberry Pi 5 as central platform with standard interfaces (I2C, GPIO, MIPI
CSI) for sensor connections.
2. Sensor Integration
Feasibility: Highly feasible.
Explanation: System uses readily available sensors with proven integration methods:
- MPU-6050 IMU (I2C): Detects acceleration and turning
- Pi Camera Module 3 (MIPI CSI): Vehicle and lane detection
- HC-SR04 Ultrasonic (GPIO): Distance measurement
- SIM7600G-H HAT: GPS location and 4G connectivity

Solution: Connect sensors through standard interfaces with proper voltage protection. Use
Extended Kalman Filter to combine GPS and IMU data for accurate positioning.

3. Detection Algorithms
Feasibility: Highly feasible.
Explanation: Detection uses established methods proven in research.
Solution: Start with simple threshold detection. Add LSTM neural network later for better
accuracy. Use YOLOv8 for real-time vehicle detection.

```
iv
```

4. Alert System
Feasibility: Highly feasible.
Explanation: System sends alerts through 4G connection using MQTT protocol. Captures
10-second video clips and uploads to cloud as evidence.
Solution: Use lightweight MQTT for fast alerts. Include GPS location, timestamp, and video
link in each alert.
5. Software Stack
Feasibility: Highly feasible.
Explanation: All required software is freely available:
- Python 3 with YOLOv8, OpenCV, TensorFlow Lite
- Raspberry Pi OS (64-bit)
- Standard libraries for sensor control and communication

Solution: Build modular system with separate components for sensors, detection, and alerts.

6. Physical Design
Feasibility: Moderately feasible.
Explanation: Bus environment requires careful design:
- Stable 27W power supply needed
- 3D-printed enclosure with cooling and ventilation
- Vibration dampening for IMU sensor accuracy
- Secure mounting to prevent tampering

Solution: Design ruggedized enclosure with active cooling, vibration isolation, and secure
mounting points.

```
v
```

##### ECONOMIC FEASIBILITY

```
Economic feasibility examines the costs of building and operating the system.
Hardware Costs:
```
```
Component Purpose Cost (INR)
Raspberry Pi 5 (8GB RAM) Main computer 7,
Raspberry Pi AI Kit (Hailo-8L) ML acceleration 6,
Official 27W Power Supply Stable power 925
64GB MicroSD Card Storage 350
MPU-6050 IMU Motion sensor 98
Pi Camera Module 3 Vehicle detection 2,
SIM7600G-H 4G HAT GPS + cellular 5,
HC-SR04 Ultrasonic (x2) Distance measurement 100
Resistors, wiring, enclosure Integration 1,
Total Hardware 24,
Table 0.3: Hardware Component Costs
```
```
Operating Costs:
```
```
Item Cost (INR)
Mobile data (per year) 2,
Maintenance (per year) 500-1,
Custom enclosure (one-time) 3,
Power backup hardware 1,000-1,
Table 0.4: Annual Operating Costs
```
Cost-Benefit Analysis: At approximately INR 24,000-27,000 per system, this is signifi-
cantly cheaper than industrial solutions using LiDAR or radar. The system provides real-time
detection, video evidence, and valuable data for driver training. For university research, this
cost enables meaningful contributions to road safety while remaining affordable for academic
budgets.

```
vi
```

## CONTENTS

ABSTRACT i

LIST OF TABLES x

LIST OF FIGURES xi




# LIST OF TABLES

0.1 Mapping of Project with Program Outcomes (POs)............... ii
0.2 Mapping of Project with Sustainable Development Goals (SDGs)........ iii
0.3 Hardware Component Costs........................... vi
0.4 Annual Operating Costs.............................. vi

2.1 Comparative Analysis of Sensor Modalities for Driver Behavior Detection... 8
2.2 Impact of Window Size and Overlap on FCN-LSTM Model Performance... 10
2.3 Comparative Performance of Classification Approaches............. 16

3.1 GPIO Pin Assignment Configuration....................... 30

```
x
```

## LIST OF FIGURES

- 1 INTRODUCTION LIST OF ABBREVIATIONS xii
   - 1.1 Background and Context
   - 1.2 Problem Statement
   - 1.3 Objectives
   - 1.4 Scope and Limitations
   - 1.5 Industry Relevance
- 2 LITERATURE REVIEW
   - 2.1 Introduction
      - 2.1.1 Background and Motivation
      - 2.1.2 Review Scope and Objectives
      - 2.1.3 Review Organization
   - 2.2 Contextual Background
      - 2.2.1 The Road Safety Crisis
      - 2.2.2 Evolution of Driver Monitoring Technologies
   - 2.3 Sensor Technologies and Data Acquisition
      - 2.3.1 Inertial Measurement Units (IMUs)
      - 2.3.2 CAN-BUS and Vehicle Diagnostic Systems
      - 2.3.3 GPS and Trajectory Data
      - 2.3.4 Computer Vision Systems
      - 2.3.5 Comparative Analysis of Sensor Modalities
   - 2.4 Feature Extraction and Signal Processing
      - 2.4.1 Statistical and Temporal Features
      - 2.4.2 Coordinate System Transformation
      - 2.4.3 Dynamic Time Warping (DTW)
      - 2.4.4 Window Size and Temporal Context
   - 2.5 Machine Learning and Classification Approaches
      - 2.5.1 Classical Machine Learning Algorithms
      - 2.5.2 Deep Learning Architectures
      - 2.5.3 Hybrid Approaches: DTW + Machine Learning
   - 2.6 System Architectures and Implementation
      - 2.6.1 Edge Computing for Driver Monitoring
      - 2.6.2 Internet of Vehicles (IoV) Integration
      - 2.6.3 Multi-Modal Fusion Architectures
      - 2.6.4 Privacy and Security Considerations
   - 2.7 Comparative Performance Analysis
      - 2.7.1 Algorithm Performance Comparison
      - 2.7.2 Key Performance Insights
      - 2.7.3 Evaluation Metrics
   - 2.8 Research Gaps and Limitations
      - 2.8.1 Generalization and Cross-Domain Applicability
      - 2.8.2 Real-Time Processing and Computational Constraints
      - 2.8.3 Training Data Requirements and Ecological Validity
      - 2.8.4 Robustness and Anomaly Handling
      - 2.8.5 Privacy-Safety Trade-offs
      - 2.8.6 Longitudinal Studies and Behavioral Plasticity
      - 2.8.7 Standardization and Benchmarking
   - 2.9 Conclusion
- 3 METHODOLOGY
   - 3.1 Approach
      - 3.1.1 Research Methodology
      - 3.1.2 System Design Philosophy
   - 3.2 Theoretical Framework
      - 3.2.1 Multi-Sensor Fusion Theory
      - 3.2.2 Behavior Classification Framework
   - 3.3 Tools and Technologies
      - 3.3.1 Hardware Platform
      - 3.3.2 Software Stack
   - 3.4 Design Process
      - 3.4.1 System Architecture Design
      - 3.4.2 Algorithm Development
      - 3.4.3 Implementation Strategy
   - 3.5 Experimental Setup
      - 3.5.1 Hardware Configuration
      - 3.5.2 Software Architecture
   - 3.6 System Block Diagram
- REFERENCES
- 3.1 Simplified EKF operation
- 3.2 Hierarchical behavior classification architecture
- 3.3 MPU-6050
- 3.4 Raspberry Pi Camera Module
- 3.5 HC-SR04
- 3.6 SIM7600G-H
- 3.7 Complete data flow diagram
- 3.8 GPIO pin mapping
- 3.9 HC-SR04 voltage divider circuit.
- 3.10 System Architecture Block Diagram


# LIST OF ABBREVIATIONS

ADAS Advanced Driver Assistance Systems
AI Artificial Intelligence
ASIC Application-Specific Integrated Circuit
CPU Central Processing Unit
DBQ Driver Behaviour Questionnaire
DPDP Digital Personal Data Protection
EKF Extended Kalman Filter
EMC Electromagnetic Compatibility
EMI Electromagnetic Interference
GPS Global Positioning System
GPU Graphics Processing Unit
GRU Gated Recurrent Unit
HAT Hardware Attached on Top
HLS HTTP Live Streaming
HSM Hardware Security Module
IMU Inertial Measurement Unit
IoT Internet of Things
IP Ingress Protection
LiDAR Light Detection and Ranging
LSTM Long Short-Term Memory
MEMS Micro-Electro-Mechanical Systems
ML Machine Learning
MQTT Message Queuing Telemetry Transport
MTMD Multiple Tuned Mass Damper
OTA Over-the-Air
QoS Quality of Service
RNN Recurrent Neural Network

```
xii
```

ROI Region of Interest
RTP Real-Time Transport Protocol
RTSP Real-Time Streaming Protocol
SSL Self-Supervised Learning
TCP Transmission Control Protocol
TCS Traction Control Systems
TMD Tuned Mass Damper
TOPS Tera Operations Per Second
V2X Vehicle-to-Everything
VSC Vehicle Stability Control
XAI Explainable Artificial Intelligence
YOLO You Only Look Once

```
xiii
```

# CHAPTER 1

# INTRODUCTION

### 1.1 Background and Context

Road safety represents one of the most critical public health and economic challenges facing
modern society. According to the World Health Organization, approximately 1.35 million peo-
ple die each year as a result of road traffic crashes, with an additional 20-50 million people
suffering non-fatal injuries In India, this challenge is particularly acute, with the subcontinent
reporting over 168 thousand fatalities in more than 400 thousand road accidents in 2022, mark-
ing it as a country with one of the highest road accident tolls globally.
While traffic regulations and enforcement mechanisms exist to address overt violations such
as speeding and running red lights, a substantial number of hazardous driving situations arise
from behaviors that, at a given moment, may not constitute a direct legal infraction but signifi-
cantly elevate the risk of collision. These behaviors include aggressive maneuvers, maintaining
excessively close proximity to other vehicles, and unsafe overtaking practices. For public buses,
which transport a large volume of commuters daily, the implications of such driving behaviors
are amplified, necessitating a robust and proactive safety monitoring mechanism.
The concept of rash driving extends beyond explicit traffic law violations, encompassing a
spectrum of aggressive or careless behaviors that significantly increase accident risk without
necessarily breaking a specific, quantifiable law at that exact moment. Research utilizing the
Driver Behaviour Questionnaire (DBQ) has identified specific behavioral indicators including
unsafe overtaking, close proximity driving (tailgating), harsh braking and acceleration, aggres-
sive cornering, and sudden lane changes.

### 1.2 Problem Statement

Traditional traffic enforcement relies primarily on post-incident analysis and reactive measures.
Current monitoring systems focus on detecting clear legal violations rather than identifying


patterns of risky behavior that precede accidents. This reactive approach fails to address the
nuanced nature of rash driving, which often manifests as a combination of multiple minor
infractions or aggressive maneuvers that collectively indicate elevated risk.
For public transportation systems, particularly buses carrying multiple passengers, the need
for proactive safety monitoring becomes even more critical. Bus drivers face unique challenges
including larger vehicle dynamics, passenger safety responsibilities, and adherence to sched-
ules, which can contribute to risky driving behaviors under pressure.
Existing solutions in the market are either prohibitively expensive for widespread deploy-
ment or lack the sophistication to distinguish between necessary evasive actions and genuinely
aggressive driving patterns. There is a clear need for a cost-effective, intelligent system capable
of real-time detection and reporting of rash driving behaviors.

### 1.3 Objectives

The primary objective of this project is to design and develop an onboard, real-time system
specifically tailored for public buses to detect rash driving behavior and alert traffic authorities.
The specific goals include:

1. Design a multi-sensor architecture integrating IMU, proximity sensors, cameras, and
    GPS for comprehensive vehicle behavior monitoring
2. Develop intelligent algorithms for detecting unsafe overtaking, close proximity driving,
    and aggressive maneuvers
3. Implement real-time data processing and sensor fusion techniques using edge computing
    platforms
4. Create a communication system for instant alert transmission to traffic authorities with
    video evidence and GPS coordinates
5. Ensure cost-effectiveness and practical implementability for university-level projects and
    eventual fleet deployment
6. Address data privacy and security requirements within the Indian regulatory framework


### 1.4 Scope and Limitations

The proposed system is designed for deployment within public bus fleets, focusing on behaviors
that indicate elevated accident risk even if they do not trigger immediate legal violations. The
system’s scope includes:
Included:

- Detection of unsafe overtaking maneuvers
- Monitoring of following distances (tailgating detection)
- Identification of aggressive vehicle dynamics (harsh braking, acceleration, cornering)
- Real-time alert generation with video evidence
- Integration with existing vehicle systems

```
Limitations:
```
- Focus on specific driving behaviors rather than comprehensive ADAS functionality
- Designed for public bus deployment, may require adaptation for other vehicle types
- Dependent on sensor accuracy and environmental conditions
- Requires cellular network connectivity for real-time alerts
- Limited to behaviors detectable through available sensor modalities

### 1.5 Industry Relevance

This project aligns with current industry trends toward connected vehicles, autonomous driv-
ing technologies, and intelligent transportation systems. The integration of edge computing
with automotive applications represents a growing market, with increasing emphasis on vehi-
cle safety systems and fleet management solutions.
The system addresses key industry challenges including the need for cost-effective safety
solutions, real-time monitoring capabilities, and compliance with emerging data protection reg-
ulations. The project contributes to the broader goal of reducing road accidents through proac-
tive intervention and data-driven safety improvements.


# CHAPTER 2

# LITERATURE REVIEW

### 2.1 Introduction

#### 2.1.1 Background and Motivation

This literature review examines the state-of-the-art in driver behavior detection, focusing on
aggressive driving monitoring systems implemented through edge AI technologies and Internet
of Vehicles (IoV) paradigms. The base paper by Soy [1] presents an edge AI-assisted IoV ap-
plication for aggressive driver monitoring in public transport buses, establishing the foundation
for this comprehensive analysis.

#### 2.1.2 Review Scope and Objectives

This review synthesizes findings from nine peer-reviewed research papers to:

1. Identify key sensor technologies and data acquisition methodologies for driver behavior
    monitoring
2. Analyze machine learning and classification approaches for aggressive driving detection
3. Evaluate system architectures and implementation strategies, particularly edge comput-
    ing solutions
4. Compare performance metrics across different methodological approaches
5. Identify critical research gaps and emerging trends in the field
6. Propose future research directions for practical deployment


#### 2.1.3 Review Organization

The review is organized as follows: Section 2 provides contextual background on road safety
challenges and technological evolution. Section 3 examines sensor technologies and data acqui-
sition methods. Section 4 analyzes feature extraction and signal processing techniques. Section
5 reviews machine learning approaches from classical algorithms to deep learning. Section 6
discusses system architectures and edge computing implementations. Section 7 presents com-
parative performance analysis. Section 8 explores application domains. Section 9 identifies
research gaps and limitations. Section 10 discusses emerging trends and future directions. Sec-
tion 11 synthesizes key findings and proposes research priorities.

### 2.2 Contextual Background

#### 2.2.1 The Road Safety Crisis

Road safety remains a persistent challenge in modern transportation systems. The National
Highway Traffic Safety Administration (NHTSA) and Virginia Tech Transportation Institute
(VTTI) surveys reveal that a minimum of 80% of accidents and 65% of near-accidents are
associated with driver distraction or impaired decision-making capabilities [1].
In public transportation systems, particularly buses serving urban centers, the impact of ag-
gressive driving extends beyond individual drivers to affect passenger safety and comfort for
millions of users daily. Aggressive driving poses multiple interconnected challenges includ-
ing increased accident risk, elevated fuel consumption, excessive emissions, and accelerated
vehicle degradation.

#### 2.2.2 Evolution of Driver Monitoring Technologies

The evolution from manual driver assessment to automated, real-time monitoring systems re-
flects technological advancement and industry recognition of behavioral factors’ critical role in
safety outcomes. Early approaches relied on questionnaire surveys and simulator-based testing,
which suffered from limitations in ecological validity and scalability.
Contemporary approaches span multiple technological paradigms [2, 9]:

- Computer vision systems analyzing facial expressions and eye movements
- Sensor-based techniques utilizing IMUs, GPS, and CAN-BUS data
- Biometric analysis and physiological monitoring


- Advanced machine learning algorithms processing multi-modal data streams

This technological diversity reflects the field’s maturation and recognition that comprehen-
sive driver behavior analysis requires multi-dimensional data fusion and sophisticated analyti-
cal frameworks.

### 2.3 Sensor Technologies and Data Acquisition

#### 2.3.1 Inertial Measurement Units (IMUs)

Hardware Specifications and Capabilities

IMU sensors combine accelerometers, gyroscopes, and magnetometers to capture vehicle dy-
namics. The base paper by Soy employs a 9-axis IMU (ICM-20948) combining 3-axis ac-
celerometer, 3-axis gyroscope, and 3-axis magnetometer components [1]. The accelerometer
measures linear acceleration at configured ranges (± 2 g to± 16 g with 16-bit resolution), while
the gyroscope measures angular displacement (± 250 to ± 2000 ◦/sec with 16-bit resolution)
across pitch, yaw, and roll dimensions.
Martinez et al.’s comprehensive survey emphasizes that accelerometer and gyroscope data
effectively capture vehicle longitudinal and lateral dynamics essential for detecting aggressive
maneuvers [9].

Smartphone-Based IMU Implementation

Al-Din’s work on real-time driving maneuver identification through smartphones validates the
effectiveness of smartphone-integrated sensors, achieving comparable accuracy to dedicated
hardware systems while offering ubiquitous deployment possibilities [3].
Smartphone-based approaches introduce challenges including sensor noise, arbitrary device
orientation, and low measurement accuracy inherent to consumer-grade electronics. Al-Din
addresses these through [5]:

- Calibration procedures estimating and correcting deterministic errors (fixed biases, scale
    factors, axes misalignment)
- One-dimensional Kalman filters for noise reduction
- Moving average filters for signal smoothing
- Locally weighted running line smoother (LOESS) techniques


The LOESS filter demonstrates superior performance in preserving signal morphology
while effectively removing high-frequency noise, making it particularly suitable for vehicle
vibration-dominated environments.

#### 2.3.2 CAN-BUS and Vehicle Diagnostic Systems

Gheni and Abdul-Rahaim’s research demonstrates the value of in-vehicle sensor networks pro-
viding direct access to engine parameters, acceleration, RPM, speed, accelerator pedal position,
and throttle position signals [6].
Advantages:

- Direct accessibility through standardized OBD-II ports
- Comprehensive parameter sets reflecting actual vehicle dynamics
- Reduced susceptibility to environmental noise compared to external sensors
- Privacy-preserving compared to camera-based systems
Limitations:
- Retrofitting existing fleets presents economical and technical challenges
- 1 Hz sampling rate may insufficiently capture rapid acceleration transients
- Requires vehicle modification and OBD-II access

#### 2.3.3 GPS and Trajectory Data

Szumska and Stanczyk’s analysis of professional city bus drivers utilizes GPS-derived acceler- ́
ation measurements at 25 Hz sampling frequency, capturing acceleration profiles across longi-
tudinal and lateral dimensions during regular operational routes [4].
GPS technology provides advantages including straightforward implementation without
vehicle structural modifications, automatic data collection without operator intervention, and
comprehensive positional information enabling contextual analysis of driving patterns across
specific road segments.
Li et al.’s fatigue driving detection system combines vehicle trajectory data from KITTI
dataset with facial image analysis, employing Canny edge detection and Hough transform to
extract lane deviation metrics [8]. This demonstrates the value of multi-modal sensor fusion
for comprehensive driver state assessment.


#### 2.3.4 Computer Vision Systems

Hariharan et al.’s driver monitoring system employs face detection models including BlazeFace
and YOLOX-tiny, followed by face landmark estimation using Google MediaPipe face mesh
and Practical Facial Landmark Detector (PFLD) models [2]. Computer vision enables rich
behavioral assessment including:

- Eye gaze tracking and distraction detection
- Drowsiness detection through eyelid closure monitoring
- Head pose estimation for attention assessment
- Facial expression analysis for emotional state

However, camera-based systems raise significant privacy concerns including continuous
visual surveillance, biometric data collection, and potential misuse of facial recognition data.

#### 2.3.5 Comparative Analysis of Sensor Modalities

```
Table 2.1: Comparative Analysis of Sensor Modalities for Driver Behavior Detection
Modality Advantages Limitations Best Applications
IMU Real-time re-
sponse, compact,
low power, smart-
phone integration
```
```
Noise susceptibil-
ity, orientation de-
pendency
```
```
Vehicle dynamics
analysis, edge
devices
CAN-BUS Comprehensive pa-
rameters, standard-
ized protocols
```
```
Retrofit costs, low
sampling rate (1
Hz)
```
```
Fleet monitoring,
privacy-sensitive
contexts
GPS Non-intrusive,
autonomous op-
eration, location
context
```
```
Low frequency (1-
10 Hz), outdoor de-
pendency
```
```
Route analysis,
geospatial patterns
```
```
Computer
Vision
```
```
Rich behavioral
data, fatigue/dis-
traction detection
```
```
Privacy concerns,
lighting sensitivity,
computationally
intensive
```
```
In-cabin monitor-
ing, drowsiness
detection
Multi-Modal
Fusion
```
```
Comprehensive
coverage, comple-
mentary informa-
tion, redundancy
```
```
Complexity,
synchronization
challenges
```
```
Advanced research
systems
```

### 2.4 Feature Extraction and Signal Processing

#### 2.4.1 Statistical and Temporal Features

Multiple papers employ statistical feature extraction from sensor time series to characterize
driving behavior patterns.

Common Statistical Features

Standard statistical measures include:

- Maximum and minimum values of acceleration/deceleration
- Mean and standard deviation of sensor readings
- Variance, kurtosis, and skewness of distributions
- Peak values and time-to-peak measurements
- Duration metrics for maneuvers
Al-Din identifies seven distinctive temporal patterns characteristic of different maneuver
classes, utilizing both time-domain metrics and statistical properties [3]. Szumska and Stanczyk ́
demonstrate that averaged maximum acceleration values effectively classify professional drivers
regardless of age and experience, suggesting that acceleration statistics capture fundamental
behavioral patterns transcending demographic variables [4].

#### 2.4.2 Coordinate System Transformation

Smartphone-based systems require transforming measurements from device-fixed coordinate
systems to vehicle-referenced frames. Al-Din implements Euler angle-based transformations
using complementary filtering combining accelerometer and gyroscope data [5].
The complementary filter equation balances sensor inputs:

θi= α(θi− 1 + ∆θgi) + (1− α)θai (2.1)
where α is an empirically determined weighting constant balancing accelerometer data
(processed through low-pass filtering for gravity vector extraction) with gyroscope data (pro-
cessed through high-pass filtering to suppress drift).


#### 2.4.3 Dynamic Time Warping (DTW)

Dynamic Time Warping emerges as a critical methodology for time-series similarity measure-
ment, particularly for sequences with temporal variations. Soy’s base paper implements DTW
alongside kNN algorithms, recognizing that identical maneuvers may exhibit temporal dis-
placement or stretching while maintaining fundamental pattern characteristics [1].
The recursive DTW formulation computes minimum distance through optimal alignment:

```
D(k,m) = d(ak,bm) + min{D(k− 1 ,m),D(k,m− 1),D(k− 1 ,m− 1)} (2.2)
```
This approach overcomes Euclidean distance limitations when comparing time series with
phase variations. Al-Din extensively validates DTW effectiveness for highway maneuver recog-
nition across six driving event types, demonstrating 9%–13.5% performance improvement
when separating recognition (via DTW) from classification (via machine learning) processes
compared to unified machine learning approaches [3].

#### 2.4.4 Window Size and Temporal Context

Gheni and Abdul-Rahaim’s systematic analysis demonstrates that window size and overlap
profoundly impact classification accuracy [6]:

```
Table 2.2: Impact of Window Size and Overlap on FCN-LSTM Model Performance
Window Size Overlap Accuracy F1-Score
5 sec 3 sec (60%) 94.39% 94.00%
10 sec 5 sec (50%) 96.23% 96.00%
10 sec 7 sec (70%) 95.46% 96.00%
10 sec 9 sec (90%) 99.01% 99.00%
```
This non-linear relationship suggests that higher overlap percentages enable comprehen-
sive behavioral context capture, though computational overhead increases proportionally. The
90% overlap case achieving 99.01% accuracy represents optimal trade-off between temporal
continuity and computational requirements.


### 2.5 Machine Learning and Classification Approaches

#### 2.5.1 Classical Machine Learning Algorithms

k-Nearest Neighbors (kNN)

Soy’s base paper selects kNN with DTW distance measures for edge device implementation,
recognizing its non-parametric nature, simplicity, and applicability to low-dimensional data [1].
The 1NN variant predicts class membership based on single closest training example proximity.
Advantages:

- No explicit training phase required
- Immediate adaptability to new training data
- Exceptional pattern recognition for complex, non-linear relationships
- Simple implementation suitable for edge devices
Disadvantages:
- Computationally intensive during inference
- Distance calculations across entire training set required
- Performance degrades in high-dimensional spaces
Al-Din extensively validates hybrid DTW-kNN systems, achieving overall accuracy of
0.91–0.95 across six maneuver classes when separating pattern recognition from classifica-
tion [3].

Random Forest

Al-Din compares Random Forest, SVM, and kNN classifiers for hybrid and unified approaches
[3]. Random Forest achieves superior performance with average precision 0.908, recall 0.905,
and F1-score 0.91 in the hybrid approach compared to kNN (0.838–0.85) and SVM (0.875).
Random Forest’s ensemble approach provides:

- Robustness through majority voting across multiple decision trees
- Reduced overfitting through feature randomness
- Effective handling of multivariate feature sets
- Built-in feature importance metrics


Support Vector Machines (SVM)

Zylius investigates aggressive vs. safe driving classification through Random Forest and SVM
approaches, achieving approximately 84% accuracy using standard deviation of X-axis ac-
celeration as primary discriminator. Martinez et al.’s comprehensive survey highlights SVM
effectiveness for binary and multi-class classification through hyperplane optimization in high-
dimensional feature spaces [9].

#### 2.5.2 Deep Learning Architectures

Convolutional Neural Networks (CNN)

Gheni and Abdul-Rahaim propose hybrid deep learning architectures combining CNN and
LSTM (FCN-LSTM) for driver behavior classification [6]. CNN processes driving data as uni-
variate time series with multiple time steps, extracting spatial features through convolutional
layers with batch normalization and ReLU activation.
The fully convolutional block comprises three successive temporal convolutional layers
(filter sizes 128, 256, 128) achieving exceptional accuracy (99.01%) with 10-second windows
and 9-second overlap (90% overlap).
Hariharan et al.’s driver monitoring system employs CNN-based architectures for process-
ing spatial information from camera-captured driver facial features and eye movements [2].

Long Short-Term Memory (LSTM) Networks

LSTM networks address vanishing gradient problems in conventional RNNs through gating
mechanisms (input gate, forget gate, output gate) maintaining cell state across temporal se-
quences.
Gheni and Abdul-Rahaim’s FCN-LSTM architecture implements dimension shuffling to
transform 10-second temporal sequences into multivariate representation (10 variables, single
time step), enabling LSTM layers to interpret temporal dependencies [6]. The hybrid FCN-
LSTM architecture captures both:

- Local spatial features through CNN layers
- Global temporal patterns through LSTM layers

This combination achieves superior generalization compared to individual architectures,
with 99.01


ResNet50 and Transfer Learning

Li et al.’s fatigue driving detection system employs ResNet50 architecture, leveraging pre-
trained ImageNet models to extract facial and trajectory features [8]. ResNet50’s residual con-
nections mitigate internal covariate shift and enable training of very deep networks through
direct information bypass across layers.
The architecture achieves 87.63% accuracy combining:

- Facial image analysis for drowsiness detection
- Vehicle trajectory information for lane deviation assessment
This demonstrates successful fusion of diverse modalities for comprehensive driver state
assessment.

#### 2.5.3 Hybrid Approaches: DTW + Machine Learning

Al-Din’s research establishes that separating time-series recognition (DTW) from classification
(machine learning) improves performance by 9%–13.5% compared to unified approaches [3].
This two-stage methodology:

1. Uses DTW to identify temporal patterns and similarity
2. Applies machine learning classifiers to categorize recognized patterns

The hybrid approach reduces manual feature engineering requirements while maintaining
interpretability and achieving 85%–95% accuracy.

### 2.6 System Architectures and Implementation

#### 2.6.1 Edge Computing for Driver Monitoring

Edge AI Advantages

Soy’s base paper pioneers edge AI-assisted IoV applications for aggressive driver monitoring,
emphasizing critical advantages [1]:

- Real-time processing without cloud latency
- Enhanced privacy through on-device computation
- Reduced bandwidth requirements and data transmission costs


- Resilience to network connectivity variations
- Faster response times for safety-critical interventions

Hardware Constraints and Optimization

The architecture utilizes Raspberry Pi Pico (RP2040 microcontroller) with:

- Dual-core ARM Cortex-M0+ processor at 133 MHz
- 264 KB SRAM
- 2 MB flash storage
These stringent constraints require sophisticated optimization strategies. MicroPython im-
plementation limits on-device model complexity as standard Python libraries (NumPy, SciPy,
Scikit-Learn) remain unavailable.
Practical Limitations: Soy acknowledges that simultaneous sensor acquisition and kNN
classification proved computationally prohibitive, necessitating sequential processing where
sensor collection and classification operate in alternating phases [1].

Advanced Edge AI Hardware

Hariharan et al.’s TI TDA4VM edge device achieves 63 frames per second processing for driver
monitoring tasks through hardware accelerator optimization [2]. The TDA4VM features:

- Matrix Multiply Accelerator (MMA) providing 8 TOPS (8-bit) throughput
- Specialized hardware for integer precision computations
- Optimized for real-time AI inference
Lightweight architectures including BlazeFace (sub-millisecond face detection) and PFLD
(practical facial landmark detection) enable processing throughput compatible with video frame
rates.

#### 2.6.2 Internet of Vehicles (IoV) Integration

IoV paradigms enable distributed sensing, processing, and decision-making across vehicle net-
works. TIJERC001281 describes IoT-based driver monitoring integrating Arduino microcon-
troller platforms with eye blink sensors, radar sensors, and acceleration meters [7]. This archi-
tecture demonstrates democratization of driver monitoring through affordable, modular com-
ponent assembly.


#### 2.6.3 Multi-Modal Fusion Architectures

Li et al.’s fatigue detection system exemplifies multi-modal fusion combining facial imagery
and vehicle trajectory data [8]:

1. Facial Image Processing: Conversion to grayscale with histogram equalization enhanc-
    ing feature prominence
2. Trajectory Processing: Lane detection through Canny edge detection and Hough trans-
    form
3. Feature Fusion: ResNet50 accepts parallel image and trajectory streams, extracting in-
    dependent feature representations subsequently concatenated for fusion classification

#### 2.6.4 Privacy and Security Considerations

Gheni and Abdul-Rahaim emphasize CAN-BUS-based approaches addressing privacy con-
cerns associated with computer vision techniques [6]. Privacy implications include:
Computer Vision Concerns:

- Continuous visual surveillance
- Biometric data collection and storage
- Potential spoofing attacks
- Unauthorized access to facial recognition data
Privacy-Preserving Alternatives:
- CAN-BUS analysis without camera surveillance
- Edge processing preventing raw data transmission
- Federated learning with decentralized data processing
- Differential privacy techniques
Zhang et al.’s privacy-preserving federated transfer learning for driver drowsiness detec-
tion introduces decentralized data processing paradigms, where model training occurs on edge
devices without transmitting raw sensor data to centralized servers.


### 2.7 Comparative Performance Analysis

#### 2.7.1 Algorithm Performance Comparison

```
Table 2.3: Comparative Performance of Classification Approaches
Approach Accuracy
Range
```
```
Key Advantages Key Limitations
kNN + DTW 85–95% Simple, inter-
pretable, edge-
friendly
```
```
Inference computa-
tional cost
Random Forest 84–91% Robust, handles
multivariate fea-
tures
```
```
Requires manual
feature engineering
SVM 84–88% Effective for high-
dimensional data
```
```
Kernel selection
complexity
CNN 90–99% Automatic feature
extraction
```
```
Large training data
required
LSTM 90–95% Temporal depen-
dency capture
```
```
Computationally
intensive
FCN-LSTM (Hy-
brid)
```
```
96–99% Spatial + temporal
features
```
```
Highest computa-
tional cost
ResNet50 (Multi-
modal)
```
```
88% Transfer learning,
multi-modal fusion
```
```
Complex architec-
ture
```
#### 2.7.2 Key Performance Insights

Classical Machine Learning [3, 9]

- Typical accuracy: 75%–92%
- Advantages: Interpretability, lower computational requirements, minimal training data
- Disadvantages: Manual feature engineering, limited non-linear relationship capture
Deep Learning [2, 6]
- Typical accuracy: 90%–99%
- Advantages: Automatic feature extraction, complex pattern recognition, multi-modal ca-
pability
- Disadvantages: Substantial training data requirement, hyperparameter sensitivity, com-
putational intensity
Hybrid DTW + ML [1, 3]


- Typical accuracy: 85%–95%
- Advantages: Reduced manual feature engineering, temporal flexibility, improved inter-
    pretability
- Performance gain: 9%–13.5% improvement over unified approaches

#### 2.7.3 Evaluation Metrics

Consistent evaluation metrics enable comparison across diverse approaches:

- Accuracy:T P+T NT P++T NF P+F N
- Precision:T PT P+F P
- Recall:T PT P+F N
- F1-Score: 2 ×PrecisionPrecision×+RecallRecall
- Area Under Curve (AUC): Probability model correctly ranks random positive example
    higher than random negative example

```
̄ıng practices
```
### 2.8 Research Gaps and Limitations

#### 2.8.1 Generalization and Cross-Domain Applicability

Models trained on specific driver populations, vehicle types, road conditions, or geographic
regions frequently exhibit degraded performance when applied to novel contexts. While Szum-
ska and Stanczyk’s finding that acceleration statistics classify drivers independently of age and ́
experience suggests certain fundamental behavioral patterns transcend individual characteris-
tics [4], this conclusion requires validation across diverse populations and driving environ-
ments.
Specific Gaps:

- Limited cross-population validation
- Insufficient testing across vehicle types and conditions
- Geographic and cultural variation not adequately addressed
- Seasonal and weather condition impacts understudied


#### 2.8.2 Real-Time Processing and Computational Constraints

Soy’s experience implementing edge AI on resource-constrained microcontrollers reveals sub-
stantial challenges [1]:

- Sequential processing limitation reduces real-time responsiveness
- Accuracy-complexity trade-offs required for edge deployment
- More sophisticated algorithms prove computationally prohibitive
- Simultaneous sensor acquisition and classification remains challenging

#### 2.8.3 Training Data Requirements and Ecological Validity

Deep learning approaches require substantial training datasets, but obtaining naturalistic driv-
ing data with accurate behavioral labels presents logistical challenges:

- Many studies employ relatively small driver populations (4–69 drivers)
- Label generation through expert assessment introduces subjectivity
- Inter-rater agreement methodology shows potential systematic biases [3]
- Ecological validity concerns with controlled testing environments

#### 2.8.4 Robustness and Anomaly Handling

Gheni and Abdul-Rahaim’s anomaly robustness analysis demonstrates performance degrada-
tion with increasing anomaly rates [6]:

- FCN-LSTM maintains 99.01% accuracy with 0% anomalies
- Degradation to 95.19% with 50% anomalies at 1-second duration
- Sensor malfunctions and communication failures inadequately addressed
- Data corruption recovery mechanisms underexplored


#### 2.8.5 Privacy-Safety Trade-offs

Multi-modal systems achieving highest accuracy typically require camera-based facial recog-
nition, generating significant privacy implications:

- Continuous visual surveillance concerns
- Biometric data collection and storage risks
- Potential for unauthorized access or misuse
- Balance between safety benefits and privacy rights unclear

While CAN-BUS approaches offer privacy advantages, they sacrifice behavioral nuance
that facial expression and eye movement analysis provide. Privacy-preserving methods (fed-
erated learning, differential privacy) introduce computational overhead and potential accuracy
reduction.

#### 2.8.6 Longitudinal Studies and Behavioral Plasticity

Current literature predominantly presents cross-sectional designs. Critical gaps include:

- Limited understanding of behavioral changes over time
- Fatigue accumulation effects across extended periods
- Learning dynamics and training intervention effectiveness
- Long-term system effectiveness and user adaptation

#### 2.8.7 Standardization and Benchmarking

Inconsistent datasets, evaluation metrics, and experimental protocols impede comparative anal-
ysis:

- Lack of standardized benchmark datasets
- Inconsistent evaluation protocols across studies
- Varying definitions of "aggressive driving"
- Limited reproducibility due to proprietary datasets


### 2.9 Conclusion

This comprehensive literature review synthesizes diverse research perspectives on driver be-
havior detection and aggressive driving monitoring, examining technological implementations,
algorithmic approaches, application contexts, and emerging trends. The analysis reveals sig-
nificant progress toward practical, privacy-preserving, real-time driver safety systems, with
Soy’s edge AI-assisted IoV application for public transport representing a meaningful advance-
ment [1].


# CHAPTER 3

# METHODOLOGY

### 3.1 Approach

The development methodology follows a systematic approach combining theoretical research,
practical implementation, and empirical validation. The project employs a pragmatic engineer-
ing strategy that balances ambitious performance goals with real-world constraints including
cost, complexity, and deployment feasibility.

#### 3.1.1 Research Methodology

The research methodology encompasses several key phases:
Literature Analysis: Comprehensive review of existing solutions, identifying strengths,
limitations, and gaps in current approaches.
Requirements Engineering: Definition of functional and non-functional requirements
based on safety objectives, cost constraints, and deployment considerations.
Architectural Design: Development of system architecture optimizing sensor selection,
processing capabilities, and communication requirements.
Incremental Development: Phased implementation approach enabling early validation
and iterative refinement.

#### 3.1.2 System Design Philosophy

The system design philosophy prioritizes several key principles:
Sensor Fusion over Sensor Capability: Rather than relying on expensive, specialized sen-
sors, the system achieves sophisticated functionality through intelligent fusion of cost-effective
components.
Edge-First Processing: Real-time requirements necessitate on-vehicle processing capabil-
ities, minimizing dependence on external connectivity while maintaining cloud integration for


data analysis and system updates.
Modular Architecture: Component-based design enables independent development, test-
ing, and optimization of subsystems while facilitating future enhancements and modifications.

### 3.2 Theoretical Framework

#### 3.2.1 Multi-Sensor Fusion Theory

##### PREDICT

```
Where am I
going?
```
##### CORRECT

```
Where am I
actually?
```
```
IMU
Fast
100 Hz
```
```
GPS
Accurate
1 Hz
```
```
Motion
```
```
Position
```
```
Step 1
Based on
motion
```
```
Step 2
Adjust with
GPS
```
##### BEST ESTIMATE

```
Accurate + Smooth
```
```
Why both sensors?
IMU: Fast, drifts
GPS: Accurate, slow
Result: Fast & accurate!
```
```
Figure 3.1: Simplified EKF operation
```
The theoretical foundation of the system rests on multi-sensor fusion principles, particularly the
Extended Kalman Filter (EKF) for state estimation. The EKF provides optimal state estimation
by combining predictions from dynamic models with observations from sensors.
The vehicle state vector is defined as:

```
x = [x,y,z,vx,vy,vz,φ,θ,ψ,ωx,ωy,ωz]T (3.1)
```
where (x,y,z) represent position, (vx,vy,vz) represent velocity, (φ,θ,ψ) represent orientation
(roll, pitch, yaw), and (ωx,ωy,ωz) represent angular velocities.


```
The prediction step utilizes IMU measurements:
```
```
xk|k− 1 = f (xk− 1 |k− 1 , uk, wk) (3.2)
```
```
The update step incorporates GPS measurements:
```
```
xk|k = xk|k− 1 + Kk
```
##### 

```
zk− h(xk|k− 1)
```
##### 

##### (3.3)

#### 3.2.2 Behavior Classification Framework

```
IMU Data
(Accel, Gyro)
```
```
GPS Data
(Position, Speed)
```
```
Camera
(Video Stream)
```
```
Sensor Fusion (EKF)
State Vector Generation
```
```
Threshold Detection
```
- Harsh Braking: ax<− 1. 5 g
- Harsh Accel:• Aggressive Turn: ax|>a 1. 0 g
    y| >^0.^8 g
Fast response, simple rules

```
LSTM Classification
```
```
LSTM
```
```
Temporal sequencesPattern recognition
Complex behaviors
Exceeded?Threshold PatternMatch?
```
```
Decision Fusion
(Logical OR)
```
```
Required?Alert
```
```
Immediate
Alert
```
```
Event
Logging
```
```
Continue
Monitoring
```
```
Real-timedata
```
```
Windowedsequences
```
```
Yes/No Yes/No
```
```
Critical All events Normal
```
```
Reduces false positivesIncreases confidence
```
```
<10msFast
response
```
```
Accurate100ms
latency
```
```
Figure 3.2: Hierarchical behavior classification architecture
```
Driving behavior classification employs a hierarchical approach combining threshold-based
detection for immediate response with machine learning classification for pattern recognition.


```
Threshold-based detection defines aggressive maneuvers as:
```
```
Harsh Braking: ax<− 1. 5 g (3.4)
Harsh Acceleration: ax> 1. 0 g (3.5)
Aggressive Cornering: |ay| > 0. 8 g (3.6)
```
LSTM-based classification processes temporal sequences of sensor data to identify complex
behavioral patterns beyond simple threshold violations.

### 3.3 Tools and Technologies

#### 3.3.1 Hardware Platform

Processing Unit: Raspberry Pi 5 (8GB) with Raspberry Pi AI Kit providing 13 TOPS AI
acceleration capability.
Sensors:

- MPU-6050: 6-axis IMU (3-axis accelerometer + 3-axis gyroscope)

```
Figure 3.3: MPU-6050
```

- Raspberry Pi Camera Module 3: High-resolution video capture

```
Figure 3.4: Raspberry Pi Camera Module
```
- HC-SR04: Ultrasonic proximity sensor for distance measurement

```
Figure 3.5: HC-SR04
```

- Waveshare SIM7600G-H: Integrated 4G LTE and GNSS module

```
Figure 3.6: SIM7600G-H
```
#### 3.3.2 Software Stack

Operating System: Raspberry Pi OS 64-bit (Debian Bookworm)
Core Libraries:

- OpenCV: Computer vision and image processing
- TensorFlow Lite: Machine learning inference
- Ultralytics: YOLO model deployment
- Paho-MQTT: Communication protocol implementation
- FilterPy: Kalman filter implementation for sensor fusion
- pyserial 3.5: Serial communication with SIM7600G-H cellular/GPS module
- smbus2 0.4.2: I2C interface for MPU-6050 IMU communication
- RPi.GPIO 0.7.1: GPIO pin control for ultrasonic sensors
- imutils 0.5.4: Convenience functions for image processing operations


- python-dotenv 1.0.0: Configuration management through environment variables
Development Languages: Python 3 for primary application development, with C/C++
components for performance-critical operations.

### 3.4 Design Process

#### 3.4.1 System Architecture Design

The system architecture follows a layered approach:

```
MPU-6050
IMU
```
```
Camera
Module
```
```
HC-SR04
Ultrasonic
```
```
SIM7600G
GPS
```
```
Data Acquisition
& Preprocessing
```
```
Sensor
Fusion
(EKF)
```
```
Computer
Vision
(YOLO)
```
```
Proximity
Detection
```
```
Threshold
Detection
```
```
LSTM
Classification
```
```
Detected?Event StorageLocal
```
```
MQTT
Alert
```
```
Video
Upload
```
```
Event
Log
```
```
AccelGyro VideoStream Distance PositionSpeed
```
```
IMU+GPS Frames Distance
```
```
StateVector Features
```
```
Yes Yes
```
```
Continuous
Retrieve
```
```
No
```
```
Figure 3.7: Complete data flow diagram
```
Sensor Layer: Physical sensors and data acquisition interfaces
Processing Layer: Sensor fusion, behavior detection algorithms, and machine learning
inference
Communication Layer: Alert generation, video processing, and transmission protocols
Application Layer: System coordination, configuration management, and user interfaces

#### 3.4.2 Algorithm Development

Algorithm development follows a tiered approach:


Baseline Algorithms: Simple, deterministic methods for immediate functionality and sys-
tem validation.
Advanced Algorithms: Machine learning-based approaches for improved accuracy and
reduced false positive rates.
Fusion Algorithms: Integration of multiple detection modalities for comprehensive behav-
ior analysis.

#### 3.4.3 Implementation Strategy

The implementation strategy employs a four-phase approach:
Phase 1 - Sensor Integration: Hardware assembly and individual sensor validation
Phase 2 - Baseline Detection: Simple threshold-based behavior detection with basic alert-
ing
Phase 3 - Advanced Processing: Machine learning integration and sensor fusion imple-
mentation
Phase 4 - System Integration: Complete system testing and real-world validation
This methodology ensures systematic development with early validation opportunities and
manageable complexity at each phase.
intermediate results and findings.

### 3.5 Experimental Setup

The experimental setup encompasses both laboratory-based development and real-world vali-
dation phases. The system architecture is designed to facilitate controlled testing while main-
taining applicability to actual deployment scenarios.

#### 3.5.1 Hardware Configuration

The experimental hardware setup utilizes a modular architecture enabling independent testing
of subsystems while supporting integrated system validation.
Core Processing Unit:

- Raspberry Pi 5 (8GB RAM) serving as the primary processing platform
- Raspberry Pi AI Kit providing dedicated machine learning acceleration
- 64GB Class A2 microSD card for operating system and data storage
- Official 27W USB-C power supply ensuring stable operation


```
Sensor Array:
```
- MPU-6050 6-axis IMU mounted with vibration dampening
- Raspberry Pi Camera Module 3 positioned for forward-facing coverage
- HC-SR04 ultrasonic sensors for proximity detection
- Waveshare SIM7600G-H 4G HAT providing cellular and GPS connectivity
Interconnection Architecture: The system employs standardized interfaces to minimize
complexity:
- I2C protocol for IMU communication
- MIPI CSI interface for camera connectivity
- GPIO pins for ultrasonic sensor control
- UART serial interface for cellular/GPS module communication

GPIO Pin Assignment

The system utilizes Raspberry Pi 5 GPIO pins according to the following detailed mapping:

### Raspberry Pi 5 GPIO Header

```
1
3
5
7
9
11
13
15
17
19
```
```
2
4
6
8
10
12
14
16
18
20
```
```
3.3V
5V
SDA
SCL
GND
TX
RX
G17
G27
G22
G23
G24
G25
```
```
Legend:
5V Power
3.3V Power
Ground
I2C (MPU-6050)
UART (SIM7600G)
GPIO (HC-SR04)
```
```
Connected Components:I2C: MPU-6050 IMU
UART: SIM7600G-H (GPS/4G)GPIO: 3× HC-SR04 Ultrasonic
```
```
Figure 3.8: GPIO pin mapping
```

```
Table 3.1: GPIO Pin Assignment Configuration
Physical BCM Function Connected Signal Notes
Pin GPIO Component Type
1 3.3V Power MPU-6050 VCC Power Regulated
3.3V
2 5V Power HC-SR04 VCC Power 5V for sen-
sors
3 GPIO2 I2C SDA MPU-6050 SDA Bidirectional Pull-up en-
abled
5 GPIO3 I2C SCL MPU-6050 SCL Clock Pull-up en-
abled
6 GND Ground Common GND Ground Shared
ground
8 GPIO14 UART TX SIM7600G-H RX Output Serial
comm
10 GPIO15 UART RX SIM7600G-H TX Input Serial
comm
11 GPIO17 Digital Out HC-SR04 Front TRIG Output Trigger
pulse
13 GPIO27 Digital In HC-SR04 Front ECHO Input Voltage di-
vider
15 GPIO22 Digital Out HC-SR04 Left TRIG Output Trigger
pulse
16 GPIO23 Digital In HC-SR04 Left ECHO Input Voltage di-
vider
18 GPIO24 Digital Out HC-SR04 Right TRIG Output Trigger
pulse
22 GPIO25 Digital In HC-SR04 Right ECHO Input Voltage di-
vider
39 GND Ground Sensor Ground Ground Additional
GND
```
Camera Module Connection
The Raspberry Pi Camera Module 3 connects via the dedicated MIPI CSI connector (la-
beled CAM0), not through GPIO pins. This interface provides high-bandwidth video data
transfer independent of GPIO resources.
SIM7600G-H HAT Connection
The Waveshare SIM7600G-H HAT mounts directly onto the GPIO header using all 40 pins.
Critical connections include:

- UART interface (GPIO14/15) for AT command communication
- USB connection for high-speed data transfer
- Power pins for cellular module operation


- GPIO pins for power control and status monitoring
Safety Precautions
- All GPIO connections must be made with power disconnected
- Verify voltage levels with a multimeter before connecting sensors to GPIO inputs
- Never connect 5V signals directly to GPIO inputs without voltage protection
- Use anti-static precautions when handling the Raspberry Pi and HAT boards

#### 3.5.2 Software Architecture

The software architecture implements a multi-threaded design optimized for real-time perfor-
mance and modular development.
Operating System Configuration:

- Raspberry Pi OS 64-bit (Debian Bookworm) optimized for performance
- Real-time kernel modifications for improved deterministic behavior
- Hardware interfaces enabled: I2C, SPI, Serial, Camera
- GPU memory split optimization for computer vision workloads
Core Software Components:
- Python 3.11 primary application framework
- OpenCV 4.8+ for computer vision processing
- TensorFlow Lite 2.13+ for machine learning inference
- NumPy/SciPy for numerical computations
- Paho-MQTT for communication protocols

Circuit Design and Safety Considerations

The hardware implementation requires careful attention to circuit design, particularly regarding
voltage level compatibility between sensors and the Raspberry Pi GPIO pins.
Voltage Level Protection


The Raspberry Pi 5 GPIO operates at 3.3V logic levels, while several sensors in the system
operate at 5V. Direct connection of 5V signals to 3.3V GPIO inputs risks permanent damage to
the Raspberry Pi. The HC-SR04 ultrasonic sensor presents the primary voltage compatibility
challenge, as its ECHO pin outputs 5V logic signals.
Voltage Divider Implementation
A resistor-based voltage divider circuit protects the Raspberry Pi GPIO pins from 5V sig-
nals. The voltage divider uses two resistors to reduce the 5V ECHO signal to a safe 3.3V
level:

```
Vout= Vin×RR^2
1 + R 2
```
##### (3.7)

```
For the HC-SR04 ECHO pin connection:
```
- R1 (high-side resistor): 1kΩ
- R2 (low-side resistor): 2kΩ
- Input voltage: 5V
- Output voltage: 3.3V

Vout= 5V ×1000 + 2000^2000 = 3. 33 V (3.8)
This configuration safely reduces the 5V signal to 3.3V, protecting the GPIO pin while
maintaining reliable digital signal detection.
Circuit Implementation Details

### HC-SR04

### VCC

### TRIG

### ECHO

### GND

### 5V

### GPIO17 (TRIG)

```
3.3V output (safe)
```
### GND

### 5V1kΩ

### 3.3V GPIO27 (ECHO)

### 2kΩ

### GND

```
5V 3.3V
```
### Raspberry Pi 5

```
Figure 3.9: HC-SR04 voltage divider circuit.
```

The voltage divider must be implemented for each HC-SR04 ECHO pin connection. The
circuit connections are:

1. HC-SR04 ECHO pin→ 1kΩ resistor→ Raspberry Pi GPIO input
2. Junction between 1kΩ and GPIO→ 2kΩ resistor→ Ground
    The TRIGGER pin connection requires no voltage divider, as it receives output from the
Raspberry Pi and the HC-SR04 accepts 3.3V logic inputs.
Power Supply Considerations
The HC-SR04 VCC pin connects to the Raspberry Pi’s 5V power output, while the ground
pin connects to the common ground rail. The Raspberry Pi 5’s official 27W power supply
provides sufficient current for all system components:
- Raspberry Pi 5 with AI Kit: ∼15W peak
- HC-SR04 sensors: ∼30mA per sensor
- Camera Module 3: ∼500mA
- SIM7600G-H HAT:∼2A peak during transmission
Electromagnetic Compatibility
The system implements EMI mitigation strategies including:
- Twisted pair wiring for I2C connections to minimize electromagnetic interference
- Capacitive filtering (0.1μF ceramic capacitors) across sensor power pins
- Physical separation of high-frequency digital signals from analog sensor lines
- Shielded cables for camera CSI connections in high-EMI automotive environments


### 3.6 System Block Diagram

##### RASH DRIVING DETECTION SYSTEM ARCHITECTURE

##### SENSOR LAYER

```
MPU-6050 Pi Camera HC-SR04 SIM7600G-H
IMU Module 3 Ultrasonic 4G+GPS HAT
↓
DATA ACQUISITION LAYER
I2C Driver Camera Driver GPIO/UART
(IMU Data) (Video Stream) (Distance/Location)
↓
PROCESSING LAYER
Sensor Fusion Computer Vision Behavior Detection
(Kalman Filter) (YOLO/Lane Det.) (Threshold/LSTM)
↓
DECISION LAYER
Event Detection Alert Generation Video Capture
(Fusion Logic) (JSON Payload) (Evidence Buffer)
↓
COMMUNICATION LAYER
MQTT Publisher Cloud Storage
(Real-time Alerts) (Video Evidence)
Figure 3.10: System Architecture Block Diagram
```

## REFERENCES

[1] H. Soy, “Edge AI-Assisted IoV Application for Aggressive Driver Monitoring: A Case
Study on Public Transport Buses,” Int. J. Automot. Sci. Technol., vol. 7, no. 3, pp. 213–
222, 2023, doi: 10.30939/ijastech..1335390.

[2] J. Hariharan, R. R. Varior, and S. Karunakaran, “Real-time Driver Monitoring Systems
on Edge AI Device,” arXiv preprint arXiv:2304.01555, Apr. 2023. [Online]. Available:
https://arxiv.org/abs/2304.01555

[3] M. S. N. Al-Din, “Driving Maneuvers Recognition and Classification Using A Hybrid
Pattern Matching and Machine Learning,” Int. J. Adv. Comput. Sci. Appl., vol. 14, no. 2,
pp. 247–256, 2023, doi: 10.14569/IJACSA.2023.0140230.

[4] E. M. Szumska and T. L. Stanczyk, “Preliminary driving style classification of the pro- ́
fessional drivers,” Arch. Automot. Eng. – Arch. Motoryz., vol. 98, no. 4, pp. 25–39, 2022,
doi: 10.14669/AM/157998.

[5] M. S. N. Al-Din, “Real-Time Identification and Classification of Driving Maneuvers using
Smartphone,” Adv. Sci. Technol. Eng. Syst. J., vol. 5, no. 6, pp. 193–205, Nov. 2020, doi:
10.25046/aj050623.

[6] H. M. Gheni and L. A. Abdul-Rahaim, “An Efficient Deep Learning Model Based on
Driver Behaviour Detection Within CAN-BUS Signals,” Rev. Intell. Artif., vol. 38, no. 1,
pp. 53–62, Feb. 2024, doi: 10.18280/ria.380106.

[7] G. Vijayaraghul, A. Thilakeshwar, K. L. Narayanan, R. Vishwa, and M. Abirami, “Mon-
itoring Driver Activities and Enhanced Public Safety Based on Internet of Things (IoT),”
TIJER - Int. Res. J., vol. 11, no. 7, pp. b665–b679, Jul. 2024.

[8] Z. Li, S. Yang, and T. Zhou, “Fatigue Driving Warning Internet System of Vehicles Based
on Trajectory and Facial Feature Fusion,” in Proc. 2nd Int. Conf. Data Anal. Mach. Learn.
(DAML), 2024, pp. 412–417, doi: 10.5220/0013525100004619.


[9] C. M. Martinez, M. Heucke, F.-Y. Wang, B. Gao, and D. Cao, “Driving Style
Recognition for Intelligent Vehicle Control and Advanced Driver Assistance: A Sur-
vey,” IEEE Trans. Intell. Transp. Syst., vol. 19, no. 3, pp. 666–676, Mar. 2018, doi:
10.1109/TITS.2017.2706978.


