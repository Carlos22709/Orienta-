// Configuración global de Jest. AsyncStorage es un módulo nativo: en las
// pruebas se usa el doble en memoria que publica la propia librería.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
