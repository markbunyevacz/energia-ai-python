"""
This file is an implementation of the "Build AI Agents with DSPy" tutorial.
It demonstrates how to build a ReAct agent for an airline customer service
using the dspy-ai library.
"""

import os
import random
import string
from typing import List, Tuple

import dspy
from pydantic import BaseModel

# --- Pydantic Models for Data Structure ---

class Date(BaseModel):
    """Custom class to represent a date and time."""
    year: int
    month: int
    day: int
    hour: int

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: str

class Flight(BaseModel):
    flight_id: str
    date_time: Date
    origin: str
    destination: str
    duration: float
    price: float

class Itinerary(BaseModel):
    confirmation_number: str
    user_profile: UserProfile
    flight: Flight

class Ticket(BaseModel):
    user_request: str
    user_profile: UserProfile

# --- Dummy Data ---

user_database = {
    "Adam": UserProfile(user_id="1", name="Adam", email="adam@gmail.com"),
    "Bob": UserProfile(user_id="2", name="Bob", email="bob@gmail.com"),
    "Chelsie": UserProfile(user_id="3", name="Chelsie", email="chelsie@gmail.com"),
    "David": UserProfile(user_id="4", name="David", email="david@gmail.com"),
}

flight_database = {
    "DA123": Flight(
        flight_id="DA123",
        origin="SFO",
        destination="JFK",
        date_time=Date(year=2025, month=9, day=1, hour=1),
        duration=3,
        price=200,
    ),
    "DA125": Flight(
        flight_id="DA125",
        origin="SFO",
        destination="JFK",
        date_time=Date(year=2025, month=9, day=1, hour=7),
        duration=9,
        price=500,
    ),
    "DA456": Flight(
        flight_id="DA456",
        origin="SFO",
        destination="SNA",
        date_time=Date(year=2025, month=10, day=1, hour=1),
        duration=2,
        price=100,
    ),
    "DA460": Flight(
        flight_id="DA460",
        origin="SFO",
        destination="SNA",
        date_time=Date(year=2025, month=10, day=1, hour=9),
        duration=2,
        price=120,
    ),
}

itinerary_database = {}
ticket_database = {}

# --- Tool Definitions ---

def fetch_flight_info(date: Date, origin: str, destination: str) -> List[Flight]:
    """Fetch flight information from origin to destination on the given date"""
    flights = []
    for _flight_id, flight in flight_database.items():
        if (
            flight.date_time.year == date.year
            and flight.date_time.month == date.month
            and flight.date_time.day == date.day
            and flight.origin == origin
            and flight.destination == destination
        ):
            flights.append(flight)
    if not flights:
        raise ValueError("No matching flight found!")
    return flights

def fetch_itinerary(confirmation_number: str) -> Itinerary:
    """Fetch a booked itinerary information from database"""
    itinerary = itinerary_database.get(confirmation_number)
    if not itinerary:
        raise ValueError("Cannot find the itinerary, please check your confirmation number.")
    return itinerary

def pick_flight(flights: List[Flight]) -> Flight:
    """Pick up the best flight that matches users' request. We pick the shortest, and cheaper one on ties."""
    sorted_flights = sorted(
        flights,
        key=lambda x: (x.duration, x.price),
    )
    return sorted_flights[0]

def _generate_id(length=8):
    chars = string.ascii_lowercase + string.digits
    return "".join(random.choices(chars, k=length))

def book_flight(flight: Flight, user_profile: UserProfile) -> Tuple[str, Itinerary]:
    """Book a flight on behalf of the user."""
    confirmation_number = _generate_id()
    while confirmation_number in itinerary_database:
        confirmation_number = _generate_id()
    
    new_itinerary = Itinerary(
        confirmation_number=confirmation_number,
        user_profile=user_profile,
        flight=flight,
    )
    itinerary_database[confirmation_number] = new_itinerary
    return confirmation_number, new_itinerary

def cancel_itinerary(confirmation_number: str, user_profile: UserProfile) -> str:
    """Cancel an itinerary on behalf of the user."""
    if confirmation_number in itinerary_database and itinerary_database[confirmation_number].user_profile.user_id == user_profile.user_id:
        del itinerary_database[confirmation_number]
        return f"Itinerary {confirmation_number} cancelled successfully."
    raise ValueError("Cannot find the itinerary, please check your confirmation number and user profile.")

def get_user_info(name: str) -> UserProfile:
    """Fetch the user profile from database with given name."""
    user = user_database.get(name)
    if not user:
        raise ValueError(f"User {name} not found.")
    return user

def file_ticket(user_request: str, user_profile: UserProfile) -> str:
    """File a customer support ticket if this is something the agent cannot handle."""
    ticket_id = _generate_id(length=6)
    ticket_database[ticket_id] = Ticket(
        user_request=user_request,
        user_profile=user_profile,
    )
    return ticket_id

# --- Agent Definition ---

class DSPyAirlineCustomerService(dspy.Signature):
    """You are an airline customer service agent that helps user book and manage flights.

    You are given a list of tools to handle user request, and you should decide the right tool to use in order to
    fulfill users' request."""

    user_request: str = dspy.InputField()
    process_result: str = dspy.OutputField(
        desc=(
            "Message that summarizes the process result, and the information users need, e.g., the "
            "confirmation_number if a new flight is booked."
        )
    )

agent = dspy.ReAct(
    DSPyAirlineCustomerService,
    tools=[
        fetch_flight_info,
        fetch_itinerary,
        pick_flight,
        book_flight,
        cancel_itinerary,
        get_user_info,
        file_ticket,
    ],
)

def main():
    """Main function to run the airline agent demo."""
    # The tutorial uses OpenAI, but this project seems to use Anthropic Claude.
    # DSPy supports Claude. Configuration would look something like this:
    # from src.energia_ai.config.settings import settings
    # claude = dspy.Claude(model='claude-3-opus-20240229', api_key=settings.ANTHROPIC_API_KEY)
    # dspy.configure(lm=claude)
    # For this example, we will stick to OpenAI as in the tutorial.
    
    # It's recommended to load API keys from a secure configuration,
    # not from environment variables directly in the code.
    # For example, using the project's settings management:
    # from src.energia_ai.config.settings import settings
    # os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
    if not os.environ.get("OPENAI_API_KEY"):
        print("Please set the OPENAI_API_KEY environment variable.")
        return

    dspy.configure(lm=dspy.OpenAI(model="gpt-4o-mini"))

    # --- Use Case 1: Book a flight ---
    print("--- Use Case 1: Booking a flight ---")
    result = agent(user_request="please help me book a flight from SFO to JFK on 09/01/2025, my name is Adam")
    print(result.process_result)
    print("Itinerary database:", itinerary_database)
    
    # Extract confirmation number for next step
    confirmation_number = None
    for key, value in itinerary_database.items():
        if value.user_profile.name == "Adam":
            confirmation_number = key
            break

    # --- Use Case 2: Modify a flight (not supported directly, agent should file a ticket) ---
    print("\n--- Use Case 2: Modifying a flight ---")
    if confirmation_number:
        result = agent(user_request=f"I want to take DA125 instead on 09/01, please help me modify my itinerary {confirmation_number}")
        print(result.process_result)
        print("Ticket database:", ticket_database)
    else:
        print("Skipping use case 2 because booking failed.")


if __name__ == "__main__":
    main() 