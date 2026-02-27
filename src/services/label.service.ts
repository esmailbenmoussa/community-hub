/**
 * Label Service
 * Handles CRUD operations for discussion labels using Azure DevOps Extension Data Service.
 * Labels are stored at the project scope.
 */

import * as SDK from 'azure-devops-extension-sdk';
import {
  Label,
  CreateLabelInput,
  UpdateLabelInput,
  EDS_COLLECTIONS,
} from '@/types';
import { isDevMode } from '@/utils/environment';
import { mockLabels } from '@/mocks/discussions';

/**
 * Extension Data Service interface
 */
interface IExtensionDataService {
  getExtensionDataManager(
    extensionId: string,
    accessToken: string
  ): Promise<IExtensionDataManager>;
}

interface IExtensionDataManager {
  getValue<T>(
    key: string,
    options?: { scopeType: string; scopeValue?: string }
  ): Promise<T | undefined>;
  setValue<T>(
    key: string,
    value: T,
    options?: { scopeType: string; scopeValue?: string }
  ): Promise<T>;
}

/**
 * Labels document structure
 */
interface LabelsDocument {
  labels: Label[];
}

/**
 * Mock labels storage for dev mode
 */
const mockLabelsMap = new Map<string, Label>(mockLabels.map((l) => [l.id, l]));

/**
 * Generate a unique ID for new labels
 */
function generateLabelId(): string {
  return `label-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate label color format (hex color)
 */
function isValidColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validate label name
 */
function isValidLabelName(name: string): boolean {
  // Name should be 1-50 characters, alphanumeric with hyphens and underscores
  return /^[a-zA-Z0-9_-]{1,50}$/.test(name);
}

/**
 * Label Service class
 */
export class LabelService {
  private dataManager: IExtensionDataManager | null = null;
  private projectId: string | null = null;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (isDevMode()) {
      this.projectId = 'mock-project-id';
      console.log('[LabelService] Running in dev mode - using mock data');
      return;
    }

    const webContext = SDK.getWebContext();
    this.projectId = webContext.project?.id || null;

    try {
      const dataService = await SDK.getService<IExtensionDataService>(
        'ms.vss-features.extension-data-service'
      );
      const accessToken = await SDK.getAccessToken();
      this.dataManager = await dataService.getExtensionDataManager(
        SDK.getExtensionContext().id,
        accessToken
      );
    } catch (error) {
      console.error('[LabelService] Error initializing:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!isDevMode() && !this.dataManager) {
      throw new Error('LabelService not initialized. Call initialize() first.');
    }
  }

  /**
   * Get all labels for the current project
   */
  async getLabels(): Promise<Label[]> {
    this.ensureInitialized();

    if (isDevMode()) {
      return Array.from(mockLabelsMap.values());
    }

    try {
      const doc = await this.getLabelsDocument();
      return doc.labels;
    } catch (error) {
      console.error('[LabelService] Error getting labels:', error);
      return [];
    }
  }

  /**
   * Get a single label by ID
   */
  async getLabel(id: string): Promise<Label | null> {
    this.ensureInitialized();

    if (isDevMode()) {
      return mockLabelsMap.get(id) || null;
    }

    try {
      const doc = await this.getLabelsDocument();
      return doc.labels.find((l) => l.id === id) || null;
    } catch (error) {
      console.error('[LabelService] Error getting label:', error);
      return null;
    }
  }

  /**
   * Get labels by name
   */
  async getLabelsByNames(names: string[]): Promise<Label[]> {
    this.ensureInitialized();

    const allLabels = await this.getLabels();
    return allLabels.filter((l) => names.includes(l.name));
  }

  /**
   * Create a new label
   */
  async createLabel(input: CreateLabelInput): Promise<Label> {
    this.ensureInitialized();

    // Validate input
    if (!isValidLabelName(input.name)) {
      throw new Error(
        'Invalid label name. Use 1-50 alphanumeric characters, hyphens, or underscores.'
      );
    }

    if (!isValidColor(input.color)) {
      throw new Error('Invalid color format. Use hex color (e.g., #ff0000).');
    }

    // Check for duplicate name
    const existingLabels = await this.getLabels();
    if (
      existingLabels.some(
        (l) => l.name.toLowerCase() === input.name.toLowerCase()
      )
    ) {
      throw new Error('A label with this name already exists.');
    }

    const newLabel: Label = {
      id: generateLabelId(),
      name: input.name,
      color: input.color,
      description: input.description,
    };

    if (isDevMode()) {
      mockLabelsMap.set(newLabel.id, newLabel);
      return newLabel;
    }

    try {
      const doc = await this.getLabelsDocument();
      doc.labels.push(newLabel);
      await this.saveLabelsDocument(doc);
      return newLabel;
    } catch (error) {
      console.error('[LabelService] Error creating label:', error);
      throw error;
    }
  }

  /**
   * Update an existing label
   */
  async updateLabel(id: string, updates: UpdateLabelInput): Promise<Label> {
    this.ensureInitialized();

    // Validate updates
    if (updates.name !== undefined && !isValidLabelName(updates.name)) {
      throw new Error(
        'Invalid label name. Use 1-50 alphanumeric characters, hyphens, or underscores.'
      );
    }

    if (updates.color !== undefined && !isValidColor(updates.color)) {
      throw new Error('Invalid color format. Use hex color (e.g., #ff0000).');
    }

    if (isDevMode()) {
      const label = mockLabelsMap.get(id);
      if (!label) {
        throw new Error('Label not found');
      }

      // Check for duplicate name
      if (updates.name) {
        const existingWithName = Array.from(mockLabelsMap.values()).find(
          (l) =>
            l.id !== id && l.name.toLowerCase() === updates.name!.toLowerCase()
        );
        if (existingWithName) {
          throw new Error('A label with this name already exists.');
        }
      }

      const updatedLabel: Label = {
        ...label,
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.color !== undefined && { color: updates.color }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
      };
      mockLabelsMap.set(id, updatedLabel);
      return updatedLabel;
    }

    try {
      const doc = await this.getLabelsDocument();
      const index = doc.labels.findIndex((l) => l.id === id);

      if (index === -1) {
        throw new Error('Label not found');
      }

      // Check for duplicate name
      if (updates.name) {
        const existingWithName = doc.labels.find(
          (l) =>
            l.id !== id && l.name.toLowerCase() === updates.name!.toLowerCase()
        );
        if (existingWithName) {
          throw new Error('A label with this name already exists.');
        }
      }

      const updatedLabel: Label = {
        ...doc.labels[index],
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.color !== undefined && { color: updates.color }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
      };

      doc.labels[index] = updatedLabel;
      await this.saveLabelsDocument(doc);
      return updatedLabel;
    } catch (error) {
      console.error('[LabelService] Error updating label:', error);
      throw error;
    }
  }

  /**
   * Delete a label
   */
  async deleteLabel(id: string): Promise<void> {
    this.ensureInitialized();

    if (isDevMode()) {
      mockLabelsMap.delete(id);
      return;
    }

    try {
      const doc = await this.getLabelsDocument();
      const index = doc.labels.findIndex((l) => l.id === id);

      if (index === -1) {
        throw new Error('Label not found');
      }

      doc.labels.splice(index, 1);
      await this.saveLabelsDocument(doc);
    } catch (error) {
      console.error('[LabelService] Error deleting label:', error);
      throw error;
    }
  }

  /**
   * Get the labels document from Extension Data Service
   */
  private async getLabelsDocument(): Promise<LabelsDocument> {
    if (!this.dataManager || !this.projectId) {
      throw new Error('Service not properly initialized');
    }

    try {
      const doc = await this.dataManager.getValue<LabelsDocument>(
        `${EDS_COLLECTIONS.Labels}-${this.projectId}`,
        { scopeType: 'Default' }
      );

      return doc || { labels: [] };
    } catch {
      // Document doesn't exist yet
      return { labels: [] };
    }
  }

  /**
   * Save the labels document to Extension Data Service
   */
  private async saveLabelsDocument(document: LabelsDocument): Promise<void> {
    if (!this.dataManager || !this.projectId) {
      throw new Error('Service not properly initialized');
    }

    await this.dataManager.setValue(
      `${EDS_COLLECTIONS.Labels}-${this.projectId}`,
      document,
      { scopeType: 'Default' }
    );
  }
}

// Export singleton instance
export const labelService = new LabelService();
