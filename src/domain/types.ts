/**
 * Domain types for every entity in the dataset (design/data-model.md).
 * Enum value lists live here as `as const` arrays — the single source for both TS types and Zod schemas.
 * Must stay equal to `enums` in database.json (checked by tests/unit/data).
 */

export const CALL_TYPES = ['Incident', 'Problem', 'Change (RFC)', 'Request Fulfilment (ITSR)', 'Service Requests'] as const;
export type CallType = (typeof CALL_TYPES)[number];

export const CLASSIFICATIONS = ['Service Request', 'n/a'] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export const URGENCY_STANDARD = ['1-Critical', '2-High', '3-Medium', '4-Low'] as const;
export const URGENCY_RFC = ['RFC - Major', 'RFC - Medium', 'RFC - Minor'] as const;
export const IMPACT_STANDARD = ['1-Extensive/Widespread', '2-Significant/Large', '3-Moderate/Limited', '4-Minor/Localized'] as const;
export const IMPACT_RFC = ['RFC - Very High', 'RFC - High', 'RFC - Medium', 'RFC - Low', 'RFC - Very Low'] as const;
export type Urgency = (typeof URGENCY_STANDARD)[number] | (typeof URGENCY_RFC)[number];
export type Impact = (typeof IMPACT_STANDARD)[number] | (typeof IMPACT_RFC)[number];

export const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUS_BY_CALL_TYPE = {
  Incident: ['New', 'Assigned', 'In Process', 'Pending', 'Resolved', 'Re-Opened', 'Closed', 'Cancelled'],
  'Service Requests': [
    'Request Submitted', 'Waiting For Approve', 'Department Accepted', 'Department Declined', 'Head Approved',
    'Head Rejected', 'Request In-Progress', 'Request Completed', 'Request Cancelled', 'Closed',
  ],
  'Change (RFC)': [
    'Draft', 'Request For Change', 'Under Review', 'Ready for CAB', 'Scheduled for Review', 'Implementation',
    'Completed', 'Failed', 'Closed', 'Cancelled',
  ],
  Problem: ['New', 'Root Cause Identify', 'Known Error', 'Resolution Identify', 'Monitoring', 'Closed'],
  'Request Fulfilment (ITSR)': [
    'Request Submitted', 'Request In-Progress', 'Delivered', 'Waiting for return', 'Request Completed', 'Closed',
  ],
} as const satisfies Record<CallType, readonly string[]>;
export type Status = (typeof STATUS_BY_CALL_TYPE)[CallType][number];
export const ALL_STATUSES = [...new Set(Object.values(STATUS_BY_CALL_TYPE).flat())] as Status[];

export const CLOSED_STATUSES = [
  'Closed', 'Cancelled', 'Request Cancelled', 'Request Completed', 'Completed', 'Failed', 'Department Declined', 'Head Rejected',
] as const satisfies readonly Status[];

export const ACTIVITY_TYPES = ['CAB Meeting', 'Change Freeze Window', 'Deployment Dates', 'Standard Task', 'System Down Dates'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export const ACTIVITY_STATUSES = ['Staged', 'Assigned', 'Closed'] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const APPROVAL_TYPES = ['Department approval', 'Head approval'] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];
export const APPROVAL_DECISIONS = ['pending', 'approved', 'rejected'] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

export const CLOSURE_CATEGORIES = ['Fixed', 'Replaced Hardware', 'User Training', 'Workaround Provided', 'No Fault Found', 'Duplicate'] as const;
export type ClosureCategory = (typeof CLOSURE_CATEGORIES)[number];
export const FEEDBACK_CATEGORIES = ['Speed', 'Quality', 'Communication', 'Other'] as const;
export const ROLES = ['requestor', 'approver', 'agent', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const HISTORY_ACTIONS = [
  'created', 'assigned', 'status_changed', 'commented', 'approved', 'rejected', 'cancelled', 'reopened', 'auto_closed',
] as const;
export type HistoryAction = (typeof HISTORY_ACTIONS)[number];

/** ISO 8601 string with offset, e.g. 2026-11-11T09:00:00+07:00 */
export type IsoDate = string;

export interface Attachment {
  name: string;
  size: number;
  type: string;
}

export interface SupportCall {
  id: string;
  number: string;
  callType: CallType;
  classification: Classification;
  parentCategory: string | null;
  category: string | null;
  subCategory: string | null;
  templateId: string | null;
  requestorId: string;
  openedByUserId: string;
  phone: string | null;
  email: string | null;
  customerReference: string | null;
  urgency: Urgency;
  impact: Impact;
  priority: Priority;
  serviceId: string | null;
  productId: string | null;
  itemId: string | null;
  serialNumber: string | null;
  version: string | null;
  summary: string;
  notes: string;
  status: Status;
  queueId: string;
  groupId: string;
  assignedToId: string | null;
  organizationId: string | null;
  locationId: string | null;
  openDate: IsoDate;
  dueDate: IsoDate | null;
  closeDate: IsoDate | null;
  closureCategory: ClosureCategory | null;
  itsrReference: string | null;
  vvip: boolean;
  surveyResult: unknown;
  feedbackCategory: unknown;
  readByUserIds: string[];
  attachments: Attachment[];
  resolvedAt: IsoDate | null;
  /** RFC planning dates (seed call_008) — kept, not edited this round */
  scheduledDate?: IsoDate | null;
  implementationStartDate?: IsoDate | null;
  implementationEndDate?: IsoDate | null;
  systemDownStartDate?: IsoDate | null;
  systemDownEndDate?: IsoDate | null;
  cabMeetingStartDate?: IsoDate | null;
  cabMeetingEndDate?: IsoDate | null;
}

export interface CallHistory {
  id: string;
  callId: string;
  at: IsoDate;
  byUserId: string;
  action: HistoryAction;
  fromStatus: Status | null;
  toStatus: Status | null;
  comment: string | null;
  attachments?: Attachment[];
}

export interface Approval {
  id: string;
  callId: string;
  approvalType: ApprovalType;
  approverId: string;
  done: boolean;
  decision: ApprovalDecision;
  comment: string | null;
  decidedAt: IsoDate | null;
}

export interface Activity {
  id: string;
  /** null for org-wide entries such as a Change Freeze Window (seed act_003) */
  callId: string | null;
  type: ActivityType;
  taskType: string;
  subject: string;
  scheduledStart: IsoDate;
  scheduledEnd: IsoDate;
  priority: Priority | null;
  status: ActivityStatus;
  ownerId: string;
  actionPlan: string | null;
  attachments: Attachment[];
}

export interface ServiceCategory {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  icon: string;
  slaNote: string | null;
  slaStartsAfterApproval: boolean;
}

export interface ServiceDefinition {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  requestType: string;
  templateId: string;
  serviceId: string | null;
}

export interface Template {
  id: string;
  name: string;
  callType: CallType;
  classification: Classification;
  parentCategory: string | null;
  category: string | null;
  subCategory: string | null;
  defaultQueueId: string;
  defaultUrgency: Urgency;
  defaultImpact: Impact;
  requiresApproval: ApprovalType[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  groupIds: string[];
  organizationId: string | null;
  locationId: string | null;
  department: string | null;
  managerId: string | null;
  vvip: boolean;
  approvalTypes?: ApprovalType[];
}

export interface Group {
  id: string;
  name: string;
  queueId: string;
}

export interface Queue {
  id: string;
  name: string;
  groupId: string;
}

export interface NamedEntity {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  serialNumber: string | null;
  version: string | null;
  assignedToId: string | null;
}

export interface Item {
  id: string;
  productId: string;
  name: string;
}

/** Knowledge (Nice) — kept in the dataset untouched this round */
export type OutOfScopeRecord = { id: string } & Record<string, unknown>;

export interface Enums {
  callTypes: string[];
  classifications: string[];
  urgency: { standard: string[]; rfc: string[] };
  impact: { standard: string[]; rfc: string[] };
  statusByCallType: Record<string, string[]>;
  closedStatuses: string[];
  activityTypes: string[];
  activityStatuses: string[];
  approvalTypes: string[];
  approvalDecisions: string[];
  closureCategories: string[];
  feedbackCategories: string[];
  roles: string[];
}

export interface AiConfig {
  _note?: string;
  fallbackKeywordToServiceDefinition: { keywords: string[]; serviceDefinitionId: string }[];
  fallbackIntentToRoute: { keywords: string[]; route: string }[];
}

export interface Dataset {
  schemaVersion: number;
  _meta: Record<string, unknown>;
  enums: Enums;
  /** key "{urgencyNo}-{impactNo}" → Priority; may contain `_note` */
  priorityMatrix: Record<string, string>;
  rfcPriorityMatrix: Record<string, string>;
  slaHoursByPriority: Record<Priority, number> & { _note?: string };
  organizations: NamedEntity[];
  locations: NamedEntity[];
  groups: Group[];
  queues: Queue[];
  users: User[];
  rolePermissions: Record<Role, string[]>;
  products: Product[];
  items: Item[];
  services: NamedEntity[];
  serviceCategories: ServiceCategory[];
  templates: Template[];
  serviceDefinitions: ServiceDefinition[];
  supportCalls: SupportCall[];
  callHistory: CallHistory[];
  approvals: Approval[];
  activities: Activity[];
  answerBooks: OutOfScopeRecord[];
  answers: OutOfScopeRecord[];
  runningNumber: { supportCall: number };
  ai: AiConfig;
}

/** Collections that hold `{ id }` records — usable with Repository<T>. */
export type EntityKey = {
  [K in keyof Dataset]: Dataset[K] extends Array<{ id: string }> ? K : never;
}[keyof Dataset];

export type AppErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'INVALID_TRANSITION'
  | 'APPROVER_NOT_FOUND'
  | 'STORAGE_FULL'
  | 'STORAGE_CORRUPT'
  | 'AI_UNAVAILABLE';

export interface AppError {
  code: AppErrorCode;
  /** Thai message for the user */
  message: string;
  fieldErrors?: Record<string, string>;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export const APP_ERROR_MESSAGES: Record<AppErrorCode, string> = {
  FORBIDDEN: 'คุณไม่มีสิทธิ์ทำรายการนี้',
  NOT_FOUND: 'ไม่พบรายการหรือไม่มีสิทธิ์',
  VALIDATION: 'ข้อมูลไม่ครบหรือไม่ถูกต้อง',
  INVALID_TRANSITION: 'ไม่สามารถเปลี่ยนสถานะนี้ได้',
  APPROVER_NOT_FOUND: 'ไม่พบผู้อนุมัติของผู้แจ้ง',
  STORAGE_FULL: 'พื้นที่จัดเก็บเต็ม',
  STORAGE_CORRUPT: 'ข้อมูลในเครื่องเสียหาย ระบบโหลดข้อมูลตัวอย่างใหม่แล้ว',
  AI_UNAVAILABLE: 'AI ไม่พร้อมใช้งาน ใช้การค้นหาแบบคำสำคัญแทน',
};

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = <T = never>(code: AppErrorCode, fieldErrors?: Record<string, string>): Result<T> => ({
  ok: false,
  error: fieldErrors ? { code, message: APP_ERROR_MESSAGES[code], fieldErrors } : { code, message: APP_ERROR_MESSAGES[code] },
});
