# Facial Symmetry Flutter Test

This is a Flutter implementation of the Facial Symmetry Analysis tool, designed to test the `kwon_mediapipe_landmarker` package for 478-point facial landmark detection.

## Structure (Clean Architecture)

- `lib/domain`: Entities and Service Interfaces
- `lib/infrastructure`: Service Implementations (MediaPipe integration)
- `lib/presentation`: UI Logic (Bloc) and Widgets
- `lib/core`: Constants and Utils

## Getting Started

1.  **Navigate to project folder**:
    ```bash
    cd facial_symmetry_flutter
    ```

2.  **Install dependencies** (if not done):
    ```bash
    flutter pub get
    ```

3.  **Run on your device**:
    ```bash
    flutter run
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
