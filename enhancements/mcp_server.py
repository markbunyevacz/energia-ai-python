"""
This file implements an MCP (Model Context Protocol) server for the airline agent tutorial.
It defines and exposes a set of tools for flight booking and management.
"""

import random
import string
from typing import List, Tuple

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

mcp = FastMCP("Airline Agent")

# --- Pydantic Models for Data Structure ---

class Date(BaseModel):
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

@mcp.tool()
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
    return flights

@mcp.tool()
def fetch_itinerary(confirmation_number: str) -> Itinerary:
    """Fetch a booked itinerary information from database"""
    return itinerary_database.get(confirmation_number)

@mcp.tool()
def pick_flight(flights: List[Flight]) -> Flight:
    """Pick up the best flight that matches users' request."""
    sorted_flights = sorted(
        flights,
        key=lambda x: (
            x.get("duration") if isinstance(x, dict) else x.duration,
            x.get("price") if isinstance(x, dict) else x.price,
        ),
    )
    return sorted_flights[0]

def _generate_id(length=8):
    chars = string.ascii_lowercase + string.digits
    return "".join(random.choices(chars, k=length))

@mcp.tool()
def book_itinerary(flight: Flight, user_profile: UserProfile) -> Tuple[str, Itinerary]:
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

@mcp.tool()
def cancel_itinerary(confirmation_number: str, user_profile: UserProfile):
    """Cancel an itinerary on behalf of the user."""
    if confirmation_number in itinerary_database:
        del itinerary_database[confirmation_number]
        return
    raise ValueError("Cannot find the itinerary, please check your confirmation number.")

@mcp.tool()
def get_user_info(name: str) -> UserProfile:
    """Fetch the user profile from database with given name."""
    return user_database.get(name)

@mcp.tool()
def file_ticket(user_request: str, user_profile: UserProfile) -> str:
    """File a customer support ticket if this is something the agent cannot handle."""
    ticket_id = _generate_id(length=6)
    ticket_database[ticket_id] = Ticket(
        user_request=user_request,
        user_profile=user_profile,
    )
    return ticket_id

if __name__ == "__main__":
    mcp.run() 