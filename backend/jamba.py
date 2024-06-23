import os
from ai21 import AI21Client
from ai21.models.chat import ChatMessage
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from constants import TWITTER_TEXT, BOOK_TEXT

class ChatInput(BaseModel):
    text: str

load_dotenv()
api_key = os.environ["AI21_API_KEY"]
client = AI21Client(api_key=api_key)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.post("/api/generate-text")
async def generate_text(chat_input: ChatInput):
    response = client.chat.completions.create(
        model="jamba-instruct-preview",  # Latest model
        messages=[
            ChatMessage(
                role="system",
                content="You are former president Barack Obama. You will be given some Barack Obama text which you can use to replicate sylistically. Please chat with the user as Barack Obama.",
            ),
            ChatMessage(   
            role="user",
            content=f"Barack obama text: {BOOK_TEXT} {TWITTER_TEXT} User text: {chat_input.text}"
    )],
        temperature=0.7,
        max_tokens=400 # 
    )
    print(response.choices[0].message.content)
    return{"text": response.choices[0].message.content} 








