import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  status: 'processing' | 'completed' | 'failed' | 'pending';
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  status
}) => {
  const [dots, setDots] = useState('');

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="text-center">
        {/* Main Loader */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto relative">
            {/* Animated rings */}
            <motion.div
              className="absolute inset-0 border-4 border-blue-light/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-transparent border-t-blue-light rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-4 border-4 border-transparent border-b-purple-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Inner circle with status icon */}
            <div className="absolute inset-6 bg-gray-900 rounded-full flex items-center justify-center">
              {status === 'completed' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>
              ) : status === 'failed' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <XCircle className="w-12 h-12 text-red-500" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-light border-t-transparent rounded-full"
                />
              )}
            </div>
          </div>
        </div>

        {/* Status Text */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            {status === 'completed' ? 'Payment Successful!' : 'Processing Payment'}
          </h2>
          <div className="text-gray-400 text-lg flex items-center justify-center">
            <span>
              {status === 'completed' 
                ? 'Your payment has been processed successfully'
                : 'Please wait while we process your payment'
              }
            </span>
            {status !== 'completed' && (
              <span className="ml-1 w-4 text-left">{dots}</span>
            )}
          </div>
        </motion.div>

        {/* Payment Details */}
        <motion.div 
          className="bg-gray-800/50 rounded-lg p-4 mb-6 max-w-sm mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Amount</span>
            <span className="text-white font-semibold">{amount} {currency}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Gas Fee</span>
            <span className="text-green-400 font-semibold">0 USDC</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Network Fee</span>
            <span className="text-green-400 font-semibold">0 USDC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Cost</span>
            <span className="text-white font-semibold">{amount} {currency}</span>
          </div>
        </motion.div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-light/20 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-light/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
        </div>

        {/* Action Button */}
        {status === 'completed' && (
          <motion.button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue
          </motion.button>
        )}
        
        {status === 'failed' && (
          <motion.button
            onClick={onClose}
            className="bg-blue-light hover:bg-blue text-white font-medium py-3 px-6 rounded-lg transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Close
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessingModal; 