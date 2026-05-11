$env:ANDROID_HOME = "F:\Development\android-sdk"
$env:ANDROID_SDK_ROOT = "F:\Development\android-sdk"
$env:JAVA_HOME = "C:\Program Files\RedHat\jdk-17.0.12"
$FLUTTER_BIN = "F:\Development\flutter\bin\flutter.bat"

if ($args.Count -eq 0) {
    & $FLUTTER_BIN run
} else {
    & $FLUTTER_BIN run @args
}
