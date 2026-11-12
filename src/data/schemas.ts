/**
 * Zod schemas of every entity — parsed when the dataset is read from storage (D3-6).
 * Read-side checks: types, enums, required fields. Form-level rules (phone digits, summary length…) live in the form (task 2.8).
 */
import { z } from 'zod';
import {
  ACTIVITY_STATUSES, ACTIVITY_TYPES, ALL_STATUSES, APPROVAL_DECISIONS, APPROVAL_TYPES, CALL_TYPES, CLASSIFICATIONS,
  CLOSURE_CATEGORIES, HISTORY_ACTIONS, IMPACT_RFC, IMPACT_STANDARD, PRIORITIES, ROLES, URGENCY_RFC, URGENCY_STANDARD,
  type Activity, type Approval, type CallHistory, type Dataset, type Enums, type Item, type NamedEntity, type Product,
  type Group, type Queue, type ServiceCategory, type ServiceDefinition, type Status, type SupportCall, type Template, type User,
} from '@/domain/types';

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'invalid ISO date');
const nullableString = z.string().nullable();
const status = z.enum(ALL_STATUSES as [Status, ...Status[]]);
const urgency = z.enum([...URGENCY_STANDARD, ...URGENCY_RFC]);
const impact = z.enum([...IMPACT_STANDARD, ...IMPACT_RFC]);
const priority = z.enum(PRIORITIES);
const approvalType = z.enum(APPROVAL_TYPES);

export const attachmentSchema = z.object({ name: z.string(), size: z.number().nonnegative(), type: z.string() });

export const supportCallSchema: z.ZodType<SupportCall> = z.object({
  id: z.string().min(1),
  number: z.string().regex(/^\d{6}$/),
  callType: z.enum(CALL_TYPES),
  classification: z.enum(CLASSIFICATIONS),
  parentCategory: nullableString,
  category: nullableString,
  subCategory: nullableString,
  templateId: nullableString,
  requestorId: z.string(),
  openedByUserId: z.string(),
  phone: nullableString,
  email: nullableString,
  customerReference: nullableString,
  urgency,
  impact,
  priority,
  serviceId: nullableString,
  productId: nullableString,
  itemId: nullableString,
  serialNumber: nullableString,
  version: nullableString,
  summary: z.string(),
  notes: z.string(),
  status,
  queueId: z.string(),
  groupId: z.string(),
  assignedToId: nullableString,
  organizationId: nullableString,
  locationId: nullableString,
  openDate: isoDate,
  dueDate: isoDate.nullable(),
  closeDate: isoDate.nullable(),
  closureCategory: z.enum(CLOSURE_CATEGORIES).nullable(),
  itsrReference: nullableString,
  vvip: z.boolean(),
  surveyResult: z.unknown(),
  feedbackCategory: z.unknown(),
  readByUserIds: z.array(z.string()),
  attachments: z.array(attachmentSchema),
  // seed records have no resolvedAt — derived from history in seed.ts / storage.ts
  resolvedAt: isoDate.nullable(),
  scheduledDate: isoDate.nullable().optional(),
  implementationStartDate: isoDate.nullable().optional(),
  implementationEndDate: isoDate.nullable().optional(),
  systemDownStartDate: isoDate.nullable().optional(),
  systemDownEndDate: isoDate.nullable().optional(),
  cabMeetingStartDate: isoDate.nullable().optional(),
  cabMeetingEndDate: isoDate.nullable().optional(),
});

export const callHistorySchema: z.ZodType<CallHistory> = z.object({
  id: z.string().min(1),
  callId: z.string(),
  at: isoDate,
  byUserId: z.string(),
  action: z.enum(HISTORY_ACTIONS),
  fromStatus: status.nullable(),
  toStatus: status.nullable(),
  comment: nullableString,
  attachments: z.array(attachmentSchema).optional(),
});

export const approvalSchema: z.ZodType<Approval> = z.object({
  id: z.string().min(1),
  callId: z.string(),
  approvalType,
  approverId: z.string(),
  done: z.boolean(),
  decision: z.enum(APPROVAL_DECISIONS),
  comment: nullableString,
  decidedAt: isoDate.nullable(),
});

export const activitySchema: z.ZodType<Activity> = z.object({
  id: z.string().min(1),
  callId: nullableString,
  type: z.enum(ACTIVITY_TYPES),
  taskType: z.string(),
  subject: z.string(),
  scheduledStart: isoDate,
  scheduledEnd: isoDate,
  priority: priority.nullable(),
  status: z.enum(ACTIVITY_STATUSES),
  ownerId: z.string(),
  actionPlan: nullableString,
  attachments: z.array(attachmentSchema),
});

export const serviceCategorySchema: z.ZodType<ServiceCategory> = z.object({
  id: z.string().min(1),
  parentId: nullableString,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  slaNote: nullableString,
  slaStartsAfterApproval: z.boolean(),
});

export const serviceDefinitionSchema: z.ZodType<ServiceDefinition> = z.object({
  id: z.string().min(1),
  categoryId: z.string(),
  name: z.string(),
  description: z.string(),
  requestType: z.string(),
  templateId: z.string(),
  serviceId: nullableString,
});

export const templateSchema: z.ZodType<Template> = z.object({
  id: z.string().min(1),
  name: z.string(),
  callType: z.enum(CALL_TYPES),
  classification: z.enum(CLASSIFICATIONS),
  parentCategory: nullableString,
  category: nullableString,
  subCategory: nullableString,
  defaultQueueId: z.string(),
  defaultUrgency: urgency,
  defaultImpact: impact,
  requiresApproval: z.array(approvalType),
});

export const userSchema: z.ZodType<User> = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string(),
  phone: nullableString,
  role: z.enum(ROLES),
  groupIds: z.array(z.string()),
  organizationId: nullableString,
  locationId: nullableString,
  department: nullableString,
  managerId: nullableString,
  vvip: z.boolean(),
  approvalTypes: z.array(approvalType).optional(),
});

const namedEntitySchema: z.ZodType<NamedEntity> = z.object({ id: z.string().min(1), name: z.string() });
const groupSchema: z.ZodType<Group> = z.object({ id: z.string().min(1), name: z.string(), queueId: z.string() });
const queueSchema: z.ZodType<Queue> = z.object({ id: z.string().min(1), name: z.string(), groupId: z.string() });
const productSchema: z.ZodType<Product> = z.object({
  id: z.string().min(1),
  name: z.string(),
  category: z.string(),
  serialNumber: nullableString,
  version: nullableString,
  assignedToId: nullableString,
});
const itemSchema: z.ZodType<Item> = z.object({ id: z.string().min(1), productId: z.string(), name: z.string() });

const stringList = z.array(z.string());
const enumsSchema: z.ZodType<Enums> = z.object({
  callTypes: stringList,
  classifications: stringList,
  urgency: z.object({ standard: stringList, rfc: stringList }),
  impact: z.object({ standard: stringList, rfc: stringList }),
  statusByCallType: z.record(z.string(), stringList),
  closedStatuses: stringList,
  activityTypes: stringList,
  activityStatuses: stringList,
  approvalTypes: stringList,
  approvalDecisions: stringList,
  closureCategories: stringList,
  feedbackCategories: stringList,
  roles: stringList,
});

const keywordList = z.array(z.string().min(1)).min(1);

export const datasetSchema: z.ZodType<Dataset> = z.object({
  schemaVersion: z.number().int(),
  _meta: z.record(z.string(), z.unknown()),
  enums: enumsSchema,
  priorityMatrix: z.record(z.string(), z.string()),
  rfcPriorityMatrix: z.record(z.string(), z.string()),
  slaHoursByPriority: z.object({
    _note: z.string().optional(),
    P1: z.number().positive(),
    P2: z.number().positive(),
    P3: z.number().positive(),
    P4: z.number().positive(),
  }),
  organizations: z.array(namedEntitySchema),
  locations: z.array(namedEntitySchema),
  groups: z.array(groupSchema),
  queues: z.array(queueSchema),
  users: z.array(userSchema),
  rolePermissions: z.object({ requestor: stringList, approver: stringList, agent: stringList, admin: stringList }),
  products: z.array(productSchema),
  items: z.array(itemSchema),
  services: z.array(namedEntitySchema),
  serviceCategories: z.array(serviceCategorySchema),
  templates: z.array(templateSchema),
  serviceDefinitions: z.array(serviceDefinitionSchema),
  supportCalls: z.array(supportCallSchema),
  callHistory: z.array(callHistorySchema),
  approvals: z.array(approvalSchema),
  activities: z.array(activitySchema),
  answerBooks: z.array(z.looseObject({ id: z.string() })),
  answers: z.array(z.looseObject({ id: z.string() })),
  runningNumber: z.object({ supportCall: z.number().int().nonnegative() }),
  ai: z.object({
    _note: z.string().optional(),
    fallbackKeywordToServiceDefinition: z.array(z.object({ keywords: keywordList, serviceDefinitionId: z.string() })),
    fallbackIntentToRoute: z.array(z.object({ keywords: keywordList, route: z.string() })),
  }),
});
