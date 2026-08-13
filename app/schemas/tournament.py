from pydantic import BaseModel


class TournamentCreate(BaseModel):
    name: str
    game: str
    description: str
    organizer_id: int


class TournamentResponse(BaseModel):
    id: int
    name: str
    game: str
    description: str
    organizer_id: int
    status: str

    model_config = {
        "from_attributes": True
    }