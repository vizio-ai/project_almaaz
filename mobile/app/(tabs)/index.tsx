import React from 'react';
import { HomeScreen } from '@shared/home';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LARGE_PHOTO = require('../../assets/images/large_photo.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CARD_PHOTO = require('../../assets/images/card_photo.png');

export default function HomeTab() {
  return (
    <HomeScreen heroImage={LARGE_PHOTO} cardPhotoFallback={CARD_PHOTO} />
  );
}
