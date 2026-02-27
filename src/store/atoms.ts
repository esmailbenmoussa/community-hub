import { atom } from 'jotai';
import type { IUserContext } from 'azure-devops-extension-sdk';

/**
 * Atom for storing the current user context
 */
export const userAtom = atom<IUserContext | null>(null);

/**
 * Atom for storing the SDK ready state
 */
export const sdkReadyAtom = atom<boolean>(false);

/**
 * Atom for storing the current project name
 */
export const projectNameAtom = atom<string>('');

/**
 * Atom for storing the host/organization name
 */
export const hostNameAtom = atom<string>('');
