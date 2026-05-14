import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase";
import api from "@/services/api";
import { SystemUser, Membership, Organization, UserRole } from "@/types";
import { toast } from "sonner";

interface AuthContextType {
  user: SystemUser | null;
  firebaseUser: FirebaseUser | null;
  memberships: Membership[];
  activeOrg: Organization | null;
  activeRole: UserRole | null;
  organizations: Record<string, Organization>;
  loading: boolean;
  switchOrg: (orgId: string) => void;
  refreshContext: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  memberships: [],
  activeOrg: null,
  activeRole: null,
  loading: true,
  switchOrg: () => {},
  refreshContext: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<SystemUser | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [organizations, setOrganizations] = useState<Record<string, Organization>>({});
  const [activeOrgId, setActiveOrgId] = useState<string | null>(localStorage.getItem("activeOrgId"));
  const [loading, setLoading] = useState(true);

  const fetchContext = async () => {
    try {
      const response = await api.get("/auth/me");
      const { user: userData, memberships: memsData, organizations: orgsData } = response.data.data;
      
      setUser(userData);
      setMemberships(memsData);
      
      const orgMap: Record<string, Organization> = {};
      orgsData.forEach((org: Organization) => {
        orgMap[org.id] = org;
      });
      setOrganizations(orgMap);

      if (memsData.length > 0) {
        setActiveOrgId(currentId => {
          if (!currentId || !memsData.find((m: Membership) => m.organizationId === currentId)) {
            const newId = memsData[0].organizationId;
            localStorage.setItem("activeOrgId", newId);
            return newId;
          }
          return currentId;
        });
      } else {
        setActiveOrgId(null);
      }
    } catch (error) {
      console.error("Error fetching user context:", error);
      // Don't toast on initial load if not logged in
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        await fetchContext();
      } else {
        setUser(null);
        setMemberships([]);
        setOrganizations({});
        setActiveOrgId(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const switchOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    localStorage.setItem("activeOrgId", orgId);
  };

  const refreshContext = async () => {
    setLoading(true);
    await fetchContext();
  };

  const logout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("activeOrgId");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const activeMembership = memberships.find(m => m.organizationId === activeOrgId);
  const activeOrg = activeOrgId ? organizations[activeOrgId] || null : null;

  const value = React.useMemo(() => ({ 
    user, 
    firebaseUser, 
    memberships, 
    activeOrg, 
    activeRole: activeMembership?.role || null,
    activeOrgId,
    organizations,
    loading, 
    switchOrg,
    refreshContext,
    logout
  }), [user, firebaseUser, memberships, activeOrg, organizations, loading, activeMembership?.role, activeOrgId, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
