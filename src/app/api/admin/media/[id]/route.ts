import { createApiClient } from "@/lib/supabase/api";
import { validateAdmin } from "@/lib/admin/validation";
import { logAdminAction } from "@/lib/admin/audit-log";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaId } = await params;
    if (!mediaId) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
    }

    // 1. Validate Admin
    const { isValid, userId: adminId } = await validateAdmin();
    if (!isValid || !adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiClient = createApiClient();

    // 2. Get media details for logging and Cloudinary cleanup
    const { data: media } = await apiClient
      .from("media")
      .select("url, type, talent_id")
      .eq("id", mediaId)
      .single();

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await apiClient
      .from("media")
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      console.error("Media delete error:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete media: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // 4. Log the action
    await logAdminAction({
      admin_id: adminId,
      action: "DELETE_MEDIA",
      resource_type: "media",
      resource_id: mediaId,
      details: {
        talent_id: media.talent_id,
        media_type: media.type,
        media_url: media.url,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media deletion error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
