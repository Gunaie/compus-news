from typing import Optional
import re

from pydantic import BaseModel, Field, ConfigDict, field_validator


def validate_password(password: str) -> str:
    if len(password) < 6:
        raise ValueError('密码长度至少6位')
    if len(password) > 128:
        raise ValueError('密码长度不能超过128位')
    return password


class UserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="用户名，3-50个字符")
    password: str = Field(..., min_length=6, max_length=128, description="密码，6-128个字符")

    @field_validator('password')
    def validate_user_password(cls, v):
        return validate_password(v)


class UserInfoBase(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50, description="昵称")
    avatar: Optional[str] = Field(None, max_length=255, description="头像URL")
    gender: Optional[str] = Field(None, max_length=10, description="性别")
    bio: Optional[str] = Field(None, max_length=500, description="个人简介")


class UserInfoResponse(UserInfoBase):
    id: int
    username: str

    model_config = ConfigDict(
        from_attributes=True
    )


class UserAuthResponse(BaseModel):
    token: str
    user_info: UserInfoResponse = Field(..., alias="userInfo")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )


class UserUpdateRequest(BaseModel):
    nickname: Optional[str] = Field(None, max_length=50, description="昵称")
    avatar: Optional[str] = Field(None, max_length=255, description="头像URL")
    gender: Optional[str] = Field(None, pattern="^(male|female|unknown)$", description="性别")
    bio: Optional[str] = Field(None, max_length=500, description="个人简介")
    phone: Optional[str] = Field(None, pattern=r"^1[3-9]\d{9}$", description="手机号")


class UserChangePasswordRequest(BaseModel):
    old_password: str = Field(..., alias="oldPassword", description="旧密码")
    new_password: str = Field(..., min_length=6, alias="newPassword", description="新密码，6-128个字符")

    @field_validator('new_password')
    def validate_new_password(cls, v):
        return validate_password(v)
