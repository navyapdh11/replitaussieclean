import { useMemo, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardList, Truck, BarChart3, Users, UserCheck, Brain, MapPin, Search, Activity, ShieldCheck, Layers } from "lucide-react";

export type Permission = 
  | "bookings:read" | "bookings:write" | "bookings:delete"
  | "dispatch:read" | "dispatch:write"
  | "pricing:read" | "pricing:write"
  | "staff:read" | "staff:write" | "staff:delete"
  | "scheduling:read" | "scheduling:write"
  | "ml:read" | "ml:write"
  | "suburbs:read" | "suburbs:write"
  | "seo:read" | "seo:write"
  | "observability:read"
  | "system:read" | "system:write" | "system:admin"
  | "admin:super";

export type Role = "viewer" | "dispatcher" | "staff_manager" | "manager" | "admin" | "super_admin";

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  permission: Permission;
  children?: MenuItem[];
  badge?: string | number;
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: ["bookings:read", "dispatch:read", "pricing:read"],
  dispatcher: ["bookings:read", "bookings:write", "dispatch:read", "dispatch:write", "staff:read"],
  staff_manager: ["bookings:read", "bookings:write", "dispatch:read", "dispatch:write", "staff:read", "staff:write", "scheduling:read", "scheduling:write"],
  manager: ["bookings:read", "bookings:write", "dispatch:read", "dispatch:write", "pricing:read", "pricing:write", "staff:read", "staff:write", "scheduling:read", "scheduling:write", "ml:read", "suburbs:read", "suburbs:write", "seo:read", "seo:write"],
  admin: ["bookings:read", "bookings:write", "bookings:delete", "dispatch:read", "dispatch:write", "pricing:read", "pricing:write", "staff:read", "staff:write", "staff:delete", "scheduling:read", "scheduling:write", "ml:read", "ml:write", "suburbs:read", "suburbs:write", "seo:read", "seo:write", "observability:read", "system:read", "system:write"],
  super_admin: ["bookings:read", "bookings:write", "bookings:delete", "dispatch:read", "dispatch:write", "pricing:read", "pricing:write", "staff:read", "staff:write", "staff:delete", "scheduling:read", "scheduling:write", "ml:read", "ml:write", "suburbs:read", "suburbs:write", "seo:read", "seo:write", "observability:read", "system:read", "system:write", "system:admin", "admin:super"],
};

const TAB_ID_TO_ICON: Record<string, LucideIcon> = {
  bookings: ClipboardList,
  dispatch: Truck,
  pricing: BarChart3,
  staff: Users,
  scheduling: UserCheck,
  ml: Brain,
  suburbs: MapPin,
  seo: Search,
  observability: Activity,
  system: ShieldCheck,
  operations: Layers,
  analytics: BarChart3,
  management: Users,
};

function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required);
}

function getAccessibleChildCount(node: MenuItem, permissions: Permission[]): number {
  if (!node.children?.length) return 0;
  let count = 0;
  for (const child of node.children) {
    if (hasPermission(permissions, child.permission)) {
      count++;
      count += getAccessibleChildCount(child, permissions);
    }
  }
  return count;
}

function filterByDFS(node: MenuItem, permissions: Permission[]): MenuItem | null {
  const hasAccess = hasPermission(permissions, node.permission);
  const accessibleChildren: MenuItem[] = [];
  
  if (node.children) {
    for (const child of node.children) {
      const filteredChild = filterByDFS(child, permissions);
      if (filteredChild) {
        accessibleChildren.push(filteredChild);
      }
    }
  }
  
  if (hasAccess || accessibleChildren.length > 0) {
    return {
      ...node,
      children: accessibleChildren.length > 0 ? accessibleChildren : node.children,
    };
  }
  
  return null;
}

function collectAccessibleItems(node: MenuItem, permissions: Permission[]): MenuItem[] {
  const result: MenuItem[] = [];
  
  function traverse(n: MenuItem) {
    if (hasPermission(permissions, n.permission)) {
      result.push({ id: n.id, label: n.label, icon: n.icon, permission: n.permission, badge: n.badge });
    }
    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }
  
  traverse(node);
  return result;
}

export function useAdminMenu(role: Role) {
  const userPermissions = useMemo(() => ROLE_PERMISSIONS[role] || [], [role]);
  
  const menuTree: MenuItem[] = useMemo(() => [
    {
      id: "operations",
      label: "Operations",
      icon: TAB_ID_TO_ICON.operations,
      permission: "bookings:read",
      children: [
        { id: "bookings", label: "Bookings", icon: TAB_ID_TO_ICON.bookings, permission: "bookings:read" },
        { id: "dispatch", label: "Dispatch", icon: TAB_ID_TO_ICON.dispatch, permission: "dispatch:read" },
        { id: "scheduling", label: "Scheduling", icon: TAB_ID_TO_ICON.scheduling, permission: "scheduling:read" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TAB_ID_TO_ICON.analytics,
      permission: "pricing:read",
      children: [
        { id: "pricing", label: "Pricing", icon: TAB_ID_TO_ICON.pricing, permission: "pricing:read" },
        { id: "suburbs", label: "Suburbs", icon: TAB_ID_TO_ICON.suburbs, permission: "suburbs:read" },
        { id: "seo", label: "SEO Rankings", icon: TAB_ID_TO_ICON.seo, permission: "seo:read" },
      ],
    },
    {
      id: "management",
      label: "Management",
      icon: TAB_ID_TO_ICON.management,
      permission: "staff:read",
      children: [
        { id: "staff", label: "Staff", icon: TAB_ID_TO_ICON.staff, permission: "staff:read" },
        { id: "ml", label: "ML Forecast", icon: TAB_ID_TO_ICON.ml, permission: "ml:read" },
      ],
    },
    {
      id: "system",
      label: "System",
      icon: TAB_ID_TO_ICON.system,
      permission: "system:read",
      children: [
        { id: "observability", label: "Observability", icon: TAB_ID_TO_ICON.observability, permission: "observability:read" },
        { id: "system", label: "Admin Only", icon: TAB_ID_TO_ICON.system, permission: "system:read" },
      ],
    },
  ], []);
  
  const filteredMenu = useMemo(() => {
    const result: MenuItem[] = [];
    for (const node of menuTree) {
      const filtered = filterByDFS(node, userPermissions);
      if (filtered) {
        result.push(filtered);
      }
    }
    return result;
  }, [menuTree, userPermissions]);
  
  const flatMenu = useMemo(() => {
    const result: MenuItem[] = [];
    for (const node of menuTree) {
      const items = collectAccessibleItems(node, userPermissions);
      result.push(...items);
    }
    return result;
  }, [menuTree, userPermissions]);
  
  const canAccess = useCallback((permission: Permission): boolean => {
    return hasPermission(userPermissions, permission);
  }, [userPermissions]);
  
  const getGroupItemCount = useCallback((groupId: string): number => {
    const group = menuTree.find(g => g.id === groupId);
    if (!group) return 0;
    return getAccessibleChildCount(group, userPermissions);
  }, [menuTree, userPermissions]);
  
  return {
    menuTree,
    filteredMenu,
    flatMenu,
    canAccess,
    getGroupItemCount,
    role,
    permissions: userPermissions,
  };
}