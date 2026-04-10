import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";

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

interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  permission: Permission;
  children?: MenuItem[];
  badge?: string | number;
}

interface MenuNode {
  id: string;
  label: string;
  icon?: LucideIcon;
  permission: Permission;
  children?: MenuNode[];
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

function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required);
}

function* dfsMenuGenerator(
  items: MenuNode[],
  userPermissions: Permission[]
): Generator<MenuNode, void, unknown> {
  const stack: MenuNode[] = [...items].reverse();
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    
    if (hasPermission(userPermissions, node.permission)) {
      yield node;
      
      if (node.children?.length) {
        for (const child of [...node.children].reverse()) {
          stack.push(child);
        }
      }
    }
  }
}

export function useAdminMenu(role: Role) {
  const userPermissions = useMemo(() => ROLE_PERMISSIONS[role] || [], [role]);
  
  const menuTree: MenuNode[] = useMemo(() => [
    {
      id: "operations",
      label: "Operations",
      permission: "bookings:read",
      children: [
        { id: "bookings", label: "Bookings", permission: "bookings:read" },
        { id: "dispatch", label: "Dispatch", permission: "dispatch:read" },
        { id: "scheduling", label: "Scheduling", permission: "scheduling:read" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      permission: "pricing:read",
      children: [
        { id: "pricing", label: "Pricing", permission: "pricing:read" },
        { id: "suburbs", label: "Suburbs", permission: "suburbs:read" },
        { id: "seo", label: "SEO Rankings", permission: "seo:read" },
      ],
    },
    {
      id: "management",
      label: "Management",
      permission: "staff:read",
      children: [
        { id: "staff", label: "Staff", permission: "staff:read" },
        { id: "ml", label: "ML Forecast", permission: "ml:read" },
      ],
    },
    {
      id: "system",
      label: "System",
      permission: "system:read",
      children: [
        { id: "observability", label: "Observability", permission: "observability:read" },
        { id: "system", label: "Admin Only", permission: "system:read" },
      ],
    },
  ], []);
  
  const filteredMenu = useMemo(() => {
    const result: MenuNode[] = [];
    const generator = dfsMenuGenerator(menuTree, userPermissions);
    
    for (const node of generator) {
      const parent = result.find(p => p.id === node.id);
      if (parent && node.id !== parent.id) {
        if (!parent.children) parent.children = [];
        const existing = parent.children.find(c => c.id === node.id);
        if (!existing) parent.children.push({ ...node });
      } else if (!result.find(p => p.id === node.id)) {
        result.push({ ...node, children: undefined });
      }
    }
    
    return result;
  }, [menuTree, userPermissions]);
  
  const flatMenu = useMemo(() => {
    const result: MenuItem[] = [];
    const generator = dfsMenuGenerator(menuTree, userPermissions);
    
    for (const node of generator) {
      result.push({
        id: node.id,
        label: node.label,
        icon: node.icon,
        permission: node.permission,
        badge: node.badge,
      });
    }
    
    return result;
  }, [menuTree, userPermissions]);
  
  const canAccess = (permission: Permission): boolean => {
    return hasPermission(userPermissions, permission);
  };
  
  return {
    menuTree,
    filteredMenu,
    flatMenu,
    canAccess,
    role,
    permissions: userPermissions,
  };
}