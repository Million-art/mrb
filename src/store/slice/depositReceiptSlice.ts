import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReceiptData, ReceiptState } from '@/interface/DepositDetails';

const initialState: ReceiptState = {
  data: null,
  loading: false,
  error: null,
  uploadProgress: 0,
  uploadSuccess: false,
  isInitialized: false, 
};

const receiptSlice = createSlice({
  name: 'receipt',
  initialState,
  reducers: {
    initializeReceiptData: (state, action: PayloadAction<ReceiptData>) => {
      state.data = action.payload;
      state.error = null;
      state.isInitialized = true;
    },
    startLoading: (state) => { 
      state.loading = true;
      state.error = null;
    },
    stopLoading: (state) => { 
      state.loading = false;
    },
    setError: (state, action: PayloadAction<string>) => { 
      state.error = action.payload;
      state.loading = false;
    },
    updateUploadProgress: (state, action: PayloadAction<number>) => {  
      state.uploadProgress = action.payload;
    },
    setUploadSuccess: (state) => {  
      state.uploadSuccess = true;
      state.uploadProgress = 100;
      state.loading = false;
    },
    resetUpload: (state) => {  
      state.uploadProgress = 0;
      state.uploadSuccess = false;
      state.error = null;
    },
    clearReceipt: () => initialState,
  },
});

export const { 
  initializeReceiptData, 
  startLoading, 
  stopLoading, 
  setError, 
  updateUploadProgress, 
  setUploadSuccess, 
  resetUpload, 
  clearReceipt 
} = receiptSlice.actions;

export default receiptSlice.reducer;
