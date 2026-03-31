import { configureStore } from '@reduxjs/toolkit';
import simulationReducer from './simulationSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    simulation: simulationReducer,
    ui: uiReducer,
  },
});

export default store;
