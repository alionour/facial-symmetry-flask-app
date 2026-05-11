# Facial Symmetry Flutter Test

This is a Flutter implementation of the Facial Symmetry Analysis tool, designed to test the `kwon_mediapipe_landmarker` package for 478-point facial landmark detection.

## Structure (Clean Architecture)

- `lib/domain`: Entities and Service Interfaces
- `lib/infrastructure`: Service Implementations (MediaPipe integration)
- `lib/presentation`: UI Logic (Bloc) and Widgets
- `lib/core`: Constants and Utils

## Getting Started

### Environment Setup

This project uses a custom development environment located on the **F:** drive:

- **Flutter SDK**: `F:\Development\flutter`
- **Android SDK**: `F:\Development\android-sdk`

### Environment Variables
Ensure the following environment variables are set in your session:

```powershell
$env:ANDROID_HOME = "F:\Development\android-sdk"
$env:ANDROID_SDK_ROOT = "F:\Development\android-sdk"
$env:JAVA_HOME = "C:\Program Files\RedHat\jdk-17.0.12"
```

### Running the App

I have created shortcut scripts (`run_app.ps1` and `run_app.bat`) that automatically set up the environment for you.

**Using the script:**
```powershell
./run_app.bat
```

**Targeting a specific device:**
```powershell
./run_app.bat -d fcc7b4b8
```

## Platform Support

- **Android**: Supported (Requires Android SDK 24+)
- **iOS**: Supported (Requires iOS 12+)
- **Windows**: Supported (For UI testing, MediaPipe implementation might differ)

## Troubleshooting

### Android `minSdkVersion` Error
If you see an error about `minSdkVersion`, open `android/app/build.gradle` and change:
```gradle
minSdkVersion 24  // or higher
```

### Missing Assets
The `kwon_mediapipe_landmarker` might require a `.task` model file. If the app crashes on initialization, ensure you have the model file in `assets/` and updated `pubspec.yaml` to include it.
