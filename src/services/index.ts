/**
 * Services Index
 * Re-exports all service classes and singleton instances
 */

import { validationService } from './validation.service';
import { discussionService } from './discussion.service';
import { commentService } from './comment.service';
import { voteService } from './vote.service';
import { labelService } from './label.service';
import { fieldMappingService } from './fieldMapping.service';

// Validation Service
export { ValidationService, validationService } from './validation.service';

// Discussion Service
export { DiscussionService, discussionService } from './discussion.service';

// Comment Service
export { CommentService, commentService } from './comment.service';

// Vote Service
export { VoteService, voteService } from './vote.service';

// Label Service
export { LabelService, labelService } from './label.service';

// Field Mapping Service
export {
  FieldMappingService,
  fieldMappingService,
} from './fieldMapping.service';

/**
 * Initialize all services
 * This should be called once at application startup after SDK init
 */
export async function initializeServices(): Promise<void> {
  // Initialize services in parallel since they're independent
  await Promise.all([
    validationService.initialize(),
    discussionService.initialize(),
    commentService.initialize(),
    voteService.initialize(),
    labelService.initialize(),
    fieldMappingService.initialize(),
  ]);

  console.log('[Services] All services initialized');
}
