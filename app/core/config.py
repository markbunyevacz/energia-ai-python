from typing import List
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    # ... existing settings ...
    proxy_list: List[str] = Field(default=[], env="PROXY_LIST")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8" 