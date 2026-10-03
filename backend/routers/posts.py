from supabase import create_client
from supabase.client import ClientOptions

from routers.auth import get_current_user_id
from schemas.posts import (PostResponse, DeletePostResponse)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from database import supabase, supabase_admin, SUPABASE_URL, SUPABASE_KEY
from typing import Annotated
from fastapi import (APIRouter, Path, Depends, HTTPException, UploadFile, File, Form)
import uuid

router = APIRouter(prefix="/posts", tags=["posts"])
bearer_scheme = HTTPBearer()

BUCKET_NAME = 'users_posts'


@router.post("/create", response_model=PostResponse)
async def create_post(
    content: str = Form(),
    image: UploadFile | None = File(None),
    auth_id: str = Depends(get_current_user_id),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):

    # Authenticate requests as the current Supabase user
    db = create_client(
        SUPABASE_URL,
        SUPABASE_KEY,
        options=ClientOptions(
            headers={
                "Authorization": f"Bearer {credentials.credentials}"
            }
        )
    )
    image_url = None

    try:
        # Upload image if provided
        if image:
            print("Filename:", image.filename)
            print("Content type:", image.content_type)

            # Generate a unique filename for the uploaded image
            file_extension = image.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_extension}"

            file_bytes = await image.read()

            content_type = image.content_type or "image/jpeg"  # Default to JPEG if content type is not provided

            # Upload the image to Supabase storage
            db.storage.from_(BUCKET_NAME).upload(
                file_name,
                file_bytes,
                {
                    "content-type": content_type,
                    "upsert": "false",
                }
            )

            image_url = db.storage.from_(BUCKET_NAME).get_public_url(
                file_name
            )

        # Create the post in the database
        response = db.table('posts').insert({
            "user_id": auth_id,
            "content": content,
            "image_url": image_url,
        }).execute()

        # Get the newly created post ID
        post_id = response.data[0]["post_id"]

        # Fetch the complete post with user + reactions
        post = (
            # Use the admin client for this read so the creator's public
            # profile is present even when users-table RLS hides the join.
            supabase_admin
            .table("posts")
            .select("*, users(user_id, username, image_url), reactions(*)")
            .eq("post_id", post_id)
            .single()
            .execute()
        )

        post_data = post.data
        print("POST DATA:", post_data)

        # Convert reactions into counts
        reactions = {}

        for reaction in post_data["reactions"]:
            reaction_type = reaction["reaction_type"]
            reactions[reaction_type] = reactions.get(reaction_type, 0) + 1

        del post_data["reactions"]
        post_data["reactions"] = reactions

        return post_data

    except Exception as e:
        print("CREATE POST ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create post: {e}"
        )


@router.get("/list", response_model=list[PostResponse])
async def list_posts():
    # Fetch all posts from the database
    response = (
        # this has to be changed without admin but it will not allowed to
        # fetch users
        supabase_admin
        .table("posts")
        .select("*, users(user_id, username, image_url), reactions(*)")
        .order("created_at", desc=True)
        .execute()
    )
    posts = response.data
    for post in posts:
        reactions = {}

        for reaction in post["reactions"]:
            reaction_type = reaction["reaction_type"]
            reactions[reaction_type] = reactions.get(reaction_type, 0) + 1

        del post["reactions"]
        post["reactions"] = reactions

    return posts


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: Annotated[int, Path(ge=1)]):
    # Fetch the post from Supabase using its post ID
    response = (
        supabase
        .table("posts")
        .select("*, users(user_id, username, image_url), reactions(*)")
        .eq("post_id", post_id)
        .execute()
    )

    # Return an error if the requested post does not exist
    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Post not found"
        )

    post = response.data[0]
    reactions = {}
    for reaction in post["reactions"]:
        reaction_type = reaction["reaction_type"]
        reactions[reaction_type] = reactions.get(reaction_type, 0) + 1

    del post["reactions"]
    post["reactions"] = reactions
    return post


@router.delete("/{post_id}", response_model=DeletePostResponse)
async def delete_post(
    post_id: Annotated[int, Path(ge=1)],
    auth_id: str = Depends(get_current_user_id),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    db.postgrest.auth(credentials.credentials)

    existing = db.table("posts").select("post_id, user_id").eq("post_id", post_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Post not found")
    if existing.data[0]["user_id"] != auth_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.table("posts").delete().eq("post_id", post_id).execute()
    return {"message": "Post Deleted", "post_id": post_id}
