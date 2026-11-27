import { NativeModules, Platform } from 'react-native';

const { CameraUtils } = NativeModules;

export function muteShutter() {
  if (Platform.OS === 'android' && CameraUtils) {
    CameraUtils.muteShutter();
  }
}

export function unmuteShutter() {
  if (Platform.OS === 'android' && CameraUtils) {
    CameraUtils.unmuteShutter();
  }
}
