import { createApiClient } from "@/lib/supabase/api";
import { validateAdmin } from "@/lib/admin/validation";
import { logAdminAction } from "@/lib/admin/audit-log";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Validate Admin
    const { isValid, userId: adminId } = await validateAdmin();
    if (!isValid || !adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiClient = createApiClient();

    // 2. Get user profile for logging before deletion
    const { data: profile } = await apiClient
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", userId)
      .single();

    // 3. Delete from public.profiles (Cascading deletes should handle related data)
    // In Supabase, usually profiles has a foreign key to auth.users.
    // We'll delete from auth.users using admin API which will trigger cascading deletes if set up.
    
    const { error: deleteAuthError } = await apiClient.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("Auth delete error:", deleteAuthError);
      return NextResponse.json(
        { error: `Failed to delete user from auth: ${deleteAuthError.message}` },
        { status: 500 }
      );
    }

    // 4. Log the action
    await logAdminAction({
      admin_id: adminId,
      action: "DELETE_USER",
      resource_type: "user",
      resource_id: userId,
      details: {
        user_name: profile?.full_name || "Unknown",
        user_email: profile?.email || "Unknown",
        user_role: profile?.role || "Unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User deletion error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
