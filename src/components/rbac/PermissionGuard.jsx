import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Permission definitions by role
const ROLE_PERMISSIONS = {
  owner: ['*'], // All permissions
  admin: [
    'manage_members',
    'manage_integrations',
    'approve_requests',
    'view_audit_logs',
    'manage_knowledge',
    'create_knowledge',
    'edit_knowledge',
    'delete_knowledge',
    'manage_workflows',
    'create_workflows',
    'edit_workflows',
    'delete_workflows',
    'use_copilot',
    'view_analytics',
    'manage_settings',
  ],
  editor: [
    'manage_knowledge',
    'create_knowledge',
    'edit_knowledge',
    'manage_workflows',
    'create_workflows',
    'edit_workflows',
    'use_copilot',
    'view_analytics',
  ],
  viewer: [
    'use_copilot',
    'view_analytics',
  ],
};

// Check if role has permission
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

// Permission Guard Component
export default function PermissionGuard({ 
  permission, 
  children, 
  fallback = null,
  requireAny = false // If true, user needs ANY of the permissions (array), otherwise ALL
}) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({
          user_email: user.email,
          status: 'active'
        });

        if (memberships.length === 0) {
          setHasAccess(false);
          return;
        }

        const userRole = memberships[0].role;
        
        if (Array.isArray(permission)) {
          // Multiple permissions
          const checks = permission.map(p => hasPermission(userRole, p));
          setHasAccess(requireAny ? checks.some(c => c) : checks.every(c => c));
        } else {
          // Single permission
          setHasAccess(hasPermission(userRole, permission));
        }
      } catch (e) {
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permission, requireAny]);

  if (loading) return null;
  if (!hasAccess) return fallback;
  return children;
}

// Hook for checking permissions
export function usePermissions() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({
          user_email: user.email,
          status: 'active'
        });

        if (memberships.length > 0) {
          setRole(memberships[0].role);
        }
      } catch (e) {
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  const can = (permission) => {
    if (!role) return false;
    if (Array.isArray(permission)) {
      return permission.some(p => hasPermission(role, p));
    }
    return hasPermission(role, permission);
  };

  return { role, loading, can };
}