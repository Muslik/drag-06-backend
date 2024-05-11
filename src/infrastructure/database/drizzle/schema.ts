import { relations } from 'drizzle-orm';
import { bigserial, pgTable, varchar, boolean, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  sex: boolean('sex'),
  bio: varchar('bio'),
  email: varchar('email').unique().notNull(),
  city: varchar('city'),
  avatarColor: varchar('avatar_color').notNull(),
  username: varchar('username').unique().notNull(),
  phone: varchar('phone').unique(),
});

export const userRelations = relations(users, ({ many }) => ({
  userSocialCredentials: many(userSocialCredentials),
  roles: many(usersRoles),
  sessions: many(sessions),
}));

export const userSocialCredentials = pgTable('user_social_credentials', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  providerUserId: varchar('provider_user_id').unique(),
  providerType: varchar('provider_type'),
  userId: integer('user_id'),
});

export const userSocialCredentialsRelations = relations(userSocialCredentials, ({ one }) => ({
  user: one(users, {
    fields: [userSocialCredentials.userId],
    references: [users.id],
  }),
}));

export const roles = pgTable('roles', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name').notNull(),
  description: varchar('description'),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(usersRoles),
  permissions: many(permissions),
}));

export const usersRoles = pgTable(
  'users_roles',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId] }),
  }),
);

export const userRolesRelations = relations(usersRoles, ({ one }) => ({
  user: one(users, {
    fields: [usersRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [usersRoles.roleId],
    references: [roles.id],
  }),
}));

export const permissions = pgTable('permissions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name').notNull(),
  description: varchar('description'),
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(roles),
}));

export const rolesPermissions = pgTable('roles_permissions', {
  roleId: integer('role_id')
    .notNull()
    .references(() => roles.id),
  permissionId: integer('permission_id')
    .notNull()
    .references(() => permissions.id),
});

export const sessions = pgTable('sessions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sessionId: varchar('session_id').notNull(),
  userAgent: varchar('user_agent').notNull(),
  ip: varchar('ip').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastAccessAt: timestamp('last_access_at').notNull().defaultNow(),
  userId: integer('user_id').notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const refreshTokens = pgTable('refresh_tokens', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  token: varchar('token').notNull(),
  userAgent: varchar('user_agent').notNull(),
  ip: varchar('ip').notNull(),
  expires: integer('expires').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  userId: integer('user_id').notNull(),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
