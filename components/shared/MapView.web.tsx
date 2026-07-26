import React from 'react';
import { View, Text } from 'react-native';

export default function MapView(props: any) {
  return (
    <View style={{ padding: 20, backgroundColor: '#eee', alignItems: 'center', borderRadius: 8 }}>
      <Text style={{ color: '#666' }}>الخرائط غير مدعومة في معاينة الويب، يرجى فتح التطبيق من الهاتف.</Text>
    </View>
  );
}

export const Marker = (props: any) => null;
export const MapCircle = (props: any) => null;
export type Region = any;