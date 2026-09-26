import { Types } from "mongoose";
import { TActivityModule } from "../../../utils/activityModules";

export enum ActivityAction {
  created = "created",
  updated = "updated",
  archived = "archived",
  deleted = "deleted",
  draft = "draft",
  sent = "sent",
  invoiced = "invoiced",
}

/** @deprecated use ActivityAction */
export enum ActivitiesType {
  Updated = "Updated",
  Created = "Created",
  Archived = "Archived",
  Draft = "Draft",
  Sent = "Sent",
  Invoiced = "Invoiced",
}

export type TActivities = {
  user_id: Types.ObjectId;
  actor_id?: Types.ObjectId;
  module: TActivityModule;
  /** Record _id(s) this activity belongs to — one or many. */
  entity_ids: Types.ObjectId[];
  action: ActivityAction;
  title: string;
  metadata?: Record<string, unknown>;
  isArchive?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TRecordActivityInput = {
  user_id: Types.ObjectId | string;
  actor_id?: Types.ObjectId | string;
  module: TActivityModule;
  entity_ids: (Types.ObjectId | string)[];
  action: ActivityAction;
  title: string;
  metadata?: Record<string, unknown>;
};
