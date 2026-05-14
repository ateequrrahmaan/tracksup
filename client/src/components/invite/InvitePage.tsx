import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { doc, setDoc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle, Clock, ArrowRight, Package2 } from "lucide-react";
import { Invite, Organization } from "@/types";
import api from "@/services/api";

export const InvitePage = () => {
  const { user, firebaseUser, memberships, loading: authLoading } = useAuth();
  const { token: routeToken } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [memberOfAnother, setMemberOfAnother] = useState(false);

  const urlParams = new URLSearchParams(location.search);
  const token = routeToken || urlParams.get("token");

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setError("Invalid invite link");
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "invites", token));
        
        if (!snap.exists()) {
          setError("Invite not found");
        } else {
          const inviteData = { id: snap.id, ...snap.data() } as Invite;
          const expiryDate = inviteData.expiresAt instanceof Timestamp 
            ? inviteData.expiresAt.toDate() 
            : new Date(inviteData.expiresAt as any);
          
          if (inviteData.status !== "pending") {
            setError(`This invite has already been ${inviteData.status}`);
          } else if (expiryDate < new Date()) {
            setError("This invite has expired");
          } else {
            setInvite(inviteData);
            
            // Check existing memberships from auth context
            const activeMemberships = memberships.filter(m => m.status === "active");
            const currentOrgMembership = activeMemberships.find(m => m.organizationId === inviteData.organizationId);
            
            if (currentOrgMembership) {
              setAlreadyMember(true);
            } else if (activeMemberships.length > 0) {
              const isJoiningAsRetailer = inviteData.role === 'retailer';
              const isCurrentlyRetailerOnly = activeMemberships.every(m => m.role === 'retailer');
              
              if (!isJoiningAsRetailer || !isCurrentlyRetailerOnly) {
                setMemberOfAnother(true);
              }
            }

            // Try to fetch org details
            try {
              const orgSnap = await getDoc(doc(db, "organizations", inviteData.organizationId));
              if (orgSnap.exists()) {
                setOrg({ id: orgSnap.id, ...orgSnap.data() } as Organization);
              }
            } catch (orgErr) {
              console.log("Could not fetch full org details (expected for new users)");
              setOrg({ 
                id: inviteData.organizationId, 
                name: (inviteData as any).organizationName || "the organization" 
              } as Organization);
            }
          }
        }
      } catch (err) {
        setError("Failed to verify invite");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token, user, memberships]);

  const handleAccept = async () => {
    if (!invite || !org || !user) return;

    try {
      await api.post("/organizations/join", { token });
      toast.success(`Welcome to ${org.name}!`);
      window.location.href = "/";
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || "Failed to accept invite";
      toast.error(errorMsg);
      console.error("Invite Accept Error:", err);
    }
  };

  if (loading || authLoading) {
    return <div className="flex min-h-screen items-center justify-center">Checking invitation...</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-100 bg-red-50/10">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={() => window.location.href = "/"}>
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Package2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>You're Invited!</CardTitle>
            <CardDescription>
              You've been invited to join <strong>{org?.name}</strong> as a <strong>{invite?.role}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-zinc-500">Please log in or create an account to join.</p>
            <Button className="w-full" onClick={() => window.location.href = `/?token=${token}&auth=true`}>
              Log In / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full border-green-100 bg-green-50/10">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Already a Member</CardTitle>
            <CardDescription>
              You are already a member of <strong>{org?.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = "/"}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (memberOfAnother) {
    const isEmployee = memberships.some(m => m.role === 'employee');
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full border-orange-100 bg-orange-50/10 shadow-xl">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>{isEmployee ? "Employee Policy" : "One Organization at a Time"}</CardTitle>
            <CardDescription className="text-base">
              {isEmployee 
                ? "As an employee, you are restricted to one active organization at a time."
                : "You are currently an active member of another organization."}
              <br />
              To join <strong>{org?.name}</strong>, you must first leave your current team.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-2">
            <p className="text-sm text-zinc-500 italic">
               (System Policy: {isEmployee ? "Employees may only serve one supplier" : "One active membership permitted for your role"})
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12" variant="outline" onClick={() => window.location.href = "/"}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isEmailMatch = user.email === invite?.email;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-primary/20">
        <CardHeader className="text-center border-b pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Join the Team</CardTitle>
          <CardDescription className="text-lg">
            Join <span className="font-semibold text-zinc-900">{org?.name}</span> as {invite?.role === 'employee' ? 'an' : 'a'} <span className="capitalize text-primary">{invite?.role}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {!isEmailMatch && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>Warning: This invite was originally sent to <strong>{invite?.email}</strong>. You are currently logged in as {user.email}.</p>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Clock className="h-4 w-4" />
            <span>This offer is valid until {formatExpiry(invite?.expiresAt)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full h-12" onClick={handleAccept}>
            Join Team
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button className="w-full" variant="ghost" onClick={() => window.location.href = "/"}>
            Decline
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

function formatExpiry(timestamp: any) {
  if (!timestamp) return "";
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
}
