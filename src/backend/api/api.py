from fastapi import FastAPI # type: ignore

app = FastAPI()


@app.get("/api/get-list-items")
def getListItems() -> list[str]:
    return ["apples", "bananas", "cherries"]
