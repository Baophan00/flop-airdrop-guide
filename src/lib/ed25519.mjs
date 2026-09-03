// Simple ed25519 wrapper using @noble/curves
import { ed25519 } from '@noble/curves/ed25519.js';

export function generateKeyPair() {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return {
    privateKey,
    publicKey,
    privateKeyHex: Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
    publicKeyHex: Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
}

export function getPublicKey(privateKey) {
  return ed25519.getPublicKey(privateKey);
}

export function sign(message, privateKey) {
  return ed25519.sign(message, privateKey);
}

export function verify(signature, message, publicKey) {
  return ed25519.verify(signature, message, publicKey);
}
