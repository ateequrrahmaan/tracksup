import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, query, where, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { SystemUser, Membership, Organization, UserRole } from "@/src/types";

interface AuthContextType {
  user: SystemUser | null;
  firebaseUser: FirebaseUser | null;
  memberships: Membership[];
  activeOrg: Organization | null;
  activeRole: UserRole | null;
  loading: boolean;
  switchOrg: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  memberships: [],
  activeOrg: null,
  activeRole: null,
  loading: true,
  switchOrg: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<SystemUser | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [organizations, setOrganizations] = useState<Record<string, Organization>>({});
  const [activeOrgId, setActiveOrgId] = useState<string | null>(localStorage.getItem("activeOrgId"));
  const [loading, setLoading] = useState(true);
  const orgsUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeMems: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      
      // Cleanup previous user-specific listeners
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeMems) unsubscribeMems();
      if (orgsUnsubscribeRef.current) {
        orgsUnsubscribeRef.current();
        orgsUnsubscribeRef.current = null;
      }

      if (fUser) {
        // 1. Listen to global user profile
        const userRef = doc(db, "users", fUser.uid);
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: fUser.uid, ...docSnap.data() } as SystemUser);
          } else {
            const newUser = {
              uid: fUser.uid,
              email: fUser.email!,
              name: fUser.displayName || fUser.email!.split('@')[0],
              createdAt: new Date().toISOString()
            };
            setDoc(userRef, newUser).then(() => setUser(newUser));
          }
        }, (error) => console.error("User profile listener error:", error));

        // 2. Listen to memberships
        const memsQuery = query(collection(db, "memberships"), where("userId", "==", fUser.uid));
        unsubscribeMems = onSnapshot(memsQuery, (snapshot) => {
          const memsMap = new Map<string, Membership>();
          snapshot.docs.forEach(d => {
            memsMap.set(d.id, { id: d.id, ...d.data() } as Membership);
          });
          const mems = Array.from(memsMap.values());
          setMemberships(mems);

          const orgIds = mems.map(m => m.organizationId);
          if (orgIds.length > 0) {
            if (orgsUnsubscribeRef.current) orgsUnsubscribeRef.current();
            
            const orgsQuery = query(collection(db, "organizations"), where("__name__", "in", orgIds));
            orgsUnsubscribeRef.current = onSnapshot(orgsQuery, (snapshot) => {
              const orgsData: Record<string, Organization> = {};
              snapshot.forEach(doc => {
                orgsData[doc.id] = { id: doc.id, ...doc.data() } as Organization;
              });
              setOrganizations(orgsData);
            }, (error) => console.error("Organizations list listener error:", error));
          } else {
            if (orgsUnsubscribeRef.current) {
              orgsUnsubscribeRef.current();
              orgsUnsubscribeRef.current = null;
            }
            setOrganizations({});
          }

          if (mems.length > 0) {
            setActiveOrgId(currentId => {
              if (!currentId || !mems.find(m => m.organizationId === currentId)) {
                const newId = mems[0].organizationId;
                localStorage.setItem("activeOrgId", newId);
                return newId;
              }
              return currentId;
            });
          } else {
            setActiveOrgId(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Memberships listener error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setMemberships([]);
        setOrganizations({});
        setActiveOrgId(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeMems) unsubscribeMems();
      if (orgsUnsubscribeRef.current) orgsUnsubscribeRef.current();
    };
  }, []);

  const switchOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    localStorage.setItem("activeOrgId", orgId);
  };

  const activeMembership = memberships.find(m => m.organizationId === activeOrgId);
  const activeOrg = activeOrgId ? organizations[activeOrgId] || null : null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      memberships, 
      activeOrg, 
      activeRole: activeMembership?.role || null,
      loading, 
      switchOrg 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
