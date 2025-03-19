import AsyncStorage from '@react-native-async-storage/async-storage';

export const save = async (key, params) => {
  await AsyncStorage.setItem(key, '' + params);
}

export const get = async (key) => {
  const val = await AsyncStorage.getItem(key);
  if (val) return val;
  await save(key, '');
  return '';
}
