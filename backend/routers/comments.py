from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi import APIRouter, Path, Depends, HTTPException
from typing import Annotated
from schemas.posts import CommentRequest
from routers.auth import get_current_user_id
from supabase import create_client
from database import supabase, SUPABASE_KEY, SUPABASE_URL

router = APIRouter(prefix="/comments", tags=["comments"])
bearer_scheme = HTTPBearer()


# comments
@router.get("/{post_id}", )
async def list_comments(post_id: Annotated[int, Path(ge=1)]):
    response = (
        supabase
        .table("comments")
        .select("*, users(username)")
        .eq("post_id", post_id)
        .order("created_at", desc=False)
        .execute()
    )
    return response.data


@router.post("/{post_id}", )
async def create_comment(post_id: Annotated[int, Path(ge=1)],
                         comment: CommentRequest,
                         auth_id=Depends(get_current_user_id),
                         credentials: HTTPAuthorizationCredentials =
                         Depends(bearer_scheme)):
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    db.postgrest.auth(credentials.credentials)
    try:
        response = db.table('comments').insert({
            "user_id": auth_id,
            "post_id": post_id,
            "content": comment.content
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create comment \
                            {e}")
    return response.data[0]


@router.patch("/{comment_id}", )
async def update_comment(
    comment_id: Annotated[int, Path(ge=1)],
    comment: CommentRequest,
    auth_id=Depends(get_current_user_id),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    db.postgrest.auth(credentials.credentials)

    try:
        response = (
            db.table("comments")
            .update({
                "content": comment.content
            })
            .eq("comment_id", comment_id)
            .eq("user_id", auth_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Comment not found"
            )

        return response.data[0]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update comment: {e}"
        )


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: Annotated[int, Path(ge=1)],
    auth_id=Depends(get_current_user_id),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    db.postgrest.auth(credentials.credentials)

    try:
        response = (
            db.table("comments")
            .delete()
            .eq("comment_id", comment_id)
            .eq("user_id", auth_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Comment not found"
            )

        return {
            "message": "Comment deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete comment: {e}"
        )
