import re
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from decouple import config
from config import (
    API_KEY,
    APP_NAME,
    APP_VERSION,
    DATABASE_URL,
    DEFAULT_BUDGET_AMOUNT,
    HOST_IP,
    HOST_PORT,
    PRODUCTION_URL,
    DEV_MODE_ENABLED
)


# Database setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Security
security = HTTPBearer()
API_KEY = config("API_KEY", default=API_KEY)


# Database Models
class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    name = Column(String, index=True)
    amount = Column(Float)
    type = Column(String)  # "withdraw" or "deposit"
    timestamp = Column(DateTime(timezone=True), default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class MonthlyBudget(Base):
    __tablename__ = "monthly_budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    month_year = Column(String, index=True)  # Format: "YYYY-MM"
    budget_amount = Column(Float)
    rollover_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Setting(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True)
    username = Column(String)
    device_name = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


# Create tables
Base.metadata.create_all(bind=engine)


# Pydantic models
class TransactionCreate(BaseModel):
    device_id: str
    name: str
    amount: float
    type: str
    timestamp: datetime

class TransactionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    timestamp: datetime

class DeviceCreate(BaseModel):
    device_id: str
    username: str
    device_name: str

class DeviceResponse(BaseModel):
    id: int
    device_id: str
    username: str
    device_name: str
    created_at: datetime
    updated_at: datetime

class TransactionResponse(BaseModel):
    id: int
    device_id: str
    name: str
    amount: float
    type: str
    timestamp: datetime
    created_at: datetime
    updated_at: datetime
    username: Optional[str] = None

class MonthlyBudgetCreate(BaseModel):
    month_year: str
    budget_amount: float
    rollover_enabled: bool = True

class MonthlyBudgetUpdate(BaseModel):
    budget_amount: Optional[float] = None
    rollover_enabled: Optional[bool] = None

class MonthlyBudgetResponse(BaseModel):
    id: int
    month_year: str
    budget_amount: float
    rollover_enabled: bool
    created_at: datetime
    updated_at: datetime

class SettingCreate(BaseModel):
    key: str
    value: str

class SettingResponse(BaseModel):
    id: int
    key: str
    value: str
    updated_at: datetime

class BudgetSummary(BaseModel):
    month_year: str
    budget_amount: float
    total_transactions: float
    remaining_budget: float
    is_over_budget: bool
    rollover_enabled: bool


# FastAPI app
if DEV_MODE_ENABLED:
    app = FastAPI(title=APP_NAME, version=APP_VERSION)
else:
    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION,
        docs_url=None,
        redoc_url=None,
        openapi_url=None
    )


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if DEV_MODE_ENABLED else PRODUCTION_URL,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_api_key():
    db_gen = get_db()
    db = next(db_gen)

    try:
        api_key = db.query(Setting).filter(Setting.key == "api_key").first()
        if not api_key:
            setting = Setting()
            setting.key = "api_key"
            setting.value = API_KEY
            
            db.add(setting)
            db.commit()
            db.refresh(setting)
            api_key = setting
        return api_key.value
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass


# Dependency to verify API key
def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    api_key = get_api_key()
    if credentials.credentials != api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return credentials.credentials


# Helper functions
def get_current_month():
    return datetime.now().strftime("%Y-%m")

def get_default_budget(db: Session):
    setting = db.query(Setting).filter(Setting.key == "default_budget_amount").first()
    if setting:
        return float(setting.value)
    return DEFAULT_BUDGET_AMOUNT

def get_username_by_device_id(db: Session, device_id: str) -> Optional[str]:
    """Get username by device_id"""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    return device.username if device else None

def calculate_budget_rollover(db: Session, current_month: str):
    """Calculate budget rollover from previous month"""
    # Get previous month
    year, month = current_month.split("-")
    if month == "01":
        prev_month = f"{int(year)-1}-12"
    else:
        prev_month = f"{year}-{int(month)-1:02d}"
    
    # Get previous month's budget and rollover setting
    prev_budget = db.query(MonthlyBudget).filter(MonthlyBudget.month_year == prev_month).first()
    if not prev_budget:
        return 0.0
    
    # Calculate previous month's total transactions
    prev_transactions = db.query(Transaction).filter(
        Transaction.timestamp >= datetime.strptime(f"{prev_month}-01", "%Y-%m-%d"),
        Transaction.timestamp < datetime.strptime(f"{current_month}-01", "%Y-%m-%d")
    ).all()
    
    prev_total = sum(
        t.amount if t.type == 'withdraw' else -t.amount 
        for t in prev_transactions
    )
    prev_difference = prev_budget.budget_amount - prev_total
    
    return prev_difference


# API Endpoints
@app.get("/")
async def root():
    return {
        "name": APP_NAME,
        "version": APP_VERSION
    }


# Transactions endpoints
@app.post("/transactions/", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    db_transaction = Transaction(**transaction.model_dump())
        
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    # Add username to transaction
    db_transaction.username = get_username_by_device_id(db, db_transaction.device_id)
    return db_transaction

@app.get("/transactions/", response_model=List[TransactionResponse])
async def get_transactions(
    timezone: Optional[str],
    month_year: Optional[str] = None,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    query = db.query(Transaction)
    origin_tz = datetime(1970, 1, 1, 0, 0, 0, tzinfo=ZoneInfo('Etc/Greenwich'))
    user_tz = datetime(1970, 1, 1, 0, 0, 0, tzinfo=ZoneInfo(timezone))
    delta = user_tz - origin_tz

    if month_year:
        # Filter by month
        start_date = datetime.strptime(f"{month_year}-01", "%Y-%m-%d")
        if month_year.endswith("-12"):
            end_date = datetime.strptime(f"{month_year[:4]}-12-31", "%Y-%m-%d")
        else:
            year, month = month_year.split("-")
            next_month = f"{year}-{int(month)+1:02d}"
            end_date = datetime.strptime(f"{next_month}-01", "%Y-%m-%d")
        
        query = query.filter(Transaction.timestamp >= start_date + delta, Transaction.timestamp < end_date + delta)

    transactions = query.order_by(Transaction.timestamp.desc()).all()
    
    # Add username to each transaction
    for transaction in transactions:
        transaction.timestamp = transaction.timestamp - delta
        transaction.username = get_username_by_device_id(db, transaction.device_id)
    
    return transactions

@app.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Add username to transaction
    transaction.username = get_username_by_device_id(db, transaction.device_id)
    return transaction

@app.get("/transactions/next/{transaction_id}", response_model=TransactionResponse)
async def get_next_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    next_transaction = db.query(Transaction).order_by(Transaction.timestamp).filter(
        Transaction.timestamp > transaction.timestamp).first()
    if not next_transaction:
        raise HTTPException(status_code=404, detail=f"No transactions following transaction_id={transaction_id} found")
    
    print(f"Next transaction: {next_transaction.name} | {next_transaction.amount} | {next_transaction.timestamp}")
    return next_transaction

@app.get("/transactions/previous/{transaction_id}", response_model=TransactionResponse)
async def get_previous_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    previous_transaction = db.query(Transaction).order_by(Transaction.timestamp.desc()).filter(
        Transaction.timestamp < transaction.timestamp).first()
    if not previous_transaction:
        raise HTTPException(status_code=404, detail=f"No transactions before transaction_id={transaction_id} found")
    
    print(f"Next transaction: {previous_transaction.name} | {previous_transaction.amount} | {previous_transaction.timestamp}")
    return previous_transaction

@app.get("/transactions/oldest/", response_model=TransactionResponse)
async def get_oldest_transaction(
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    transaction = db.query(Transaction).order_by(Transaction.timestamp).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="There is no transaction.")
        
    # Add username to each transaction
    transaction.username = get_username_by_device_id(db, transaction.device_id)
    
    return transaction

@app.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = transaction_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(transaction)
    
    # Add username to transaction
    transaction.username = get_username_by_device_id(db, transaction.device_id)
    return transaction

@app.delete("/transactions/{transaction_id}", status_code=201)
async def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully"}


# Device endpoints
@app.post("/devices/", response_model=DeviceResponse)
async def create_device(
    device: DeviceCreate,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    # Check if device already exists
    existing = db.query(Device).filter(Device.device_id == device.device_id).first()
    if existing:
        # Update existing device
        existing.username = device.username
        existing.device_name = device.device_name
        existing.updated_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new device
    db_device = Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@app.get("/devices/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@app.put("/devices/{device_id}", response_model=DeviceResponse)
async def update_device_username(
    device_id: str,
    device_username: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    existing = db.query(Device).filter(Device.device_id == device_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Device not found")
    
    check_device_username = db.query(Device).filter(Device.username == device_username).first()
    if check_device_username:
        raise HTTPException(status_code=401, detail="Device username already exist")
    
    # Update existing device
    existing.username = device_username
    existing.updated_at = datetime.now()
    db.commit()
    db.refresh(existing)
    return existing


# Monthly budgets endpoints
@app.post("/monthly-budgets/", response_model=MonthlyBudgetResponse)
async def create_monthly_budget(
    budget: MonthlyBudgetCreate,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    # Check if budget already exists for this month
    existing = db.query(MonthlyBudget).filter(MonthlyBudget.month_year == budget.month_year).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget already exists for this month")
    
    db_budget = MonthlyBudget(**budget.model_dump())
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@app.get("/monthly-budgets/", response_model=List[MonthlyBudgetResponse])
async def get_monthly_budgets(
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    return db.query(MonthlyBudget).order_by(MonthlyBudget.month_year.desc()).all()

@app.get("/monthly-budgets/{month_year}", response_model=MonthlyBudgetResponse)
async def get_monthly_budget(
    month_year: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    budget = db.query(MonthlyBudget).filter(MonthlyBudget.month_year == month_year).first()
    if not budget:
        # Create budget with default amount and rollover calculation
        default_amount = get_default_budget(db)
        rollover_amount = calculate_budget_rollover(db, month_year)
        budget_amount = default_amount + rollover_amount
        
        budget = MonthlyBudget(
            month_year=month_year,
            budget_amount=budget_amount,
            rollover_enabled=True
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)
    
    return budget

@app.put("/monthly-budgets/{month_year}", response_model=MonthlyBudgetResponse)
async def update_monthly_budget(
    month_year: str,
    budget_update: MonthlyBudgetUpdate,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    budget = db.query(MonthlyBudget).filter(MonthlyBudget.month_year == month_year).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    update_data = budget_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    
    budget.updated_at = datetime.now()
    db.commit()
    db.refresh(budget)
    return budget

@app.delete("/monthly-budgets/{month_year}", status_code=201)
async def delete_monthly_budget(
    month_year: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    monthly_budget = db.query(MonthlyBudget).filter(MonthlyBudget.month_year == month_year).first()
    if month_year is None:
        raise HTTPException(404, f"monthly_budget '{month_year}' doesn't exist.")
    
    transactions = db.query(Transaction).filter(Transaction.timestamp.like(f"{month_year}-%"))
    
    if len(transactions) > 0:
        raise HTTPException(403, f"monthly_budget '{month_year}' shouldn't have transactions to be deleted.")
    
    db.delete(monthly_budget)
    db.commit()
    return {"message": "MonthlyBudget deleted successfully."}


# Settings endpoints
@app.get("/settings/", response_model=List[SettingResponse])
async def get_settings(
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    ans = db.query(Setting).all()
    return ans

@app.post("/settings/", response_model=SettingResponse)
async def create_setting(
    setting: SettingCreate,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    # Check if setting already exists
    existing = db.query(Setting).filter(Setting.key == setting.key).first()
    if existing:
        existing.value = setting.value
        existing.updated_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return existing
    
    db_setting = Setting(**setting.model_dump())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

@app.put("/settings/", response_model=SettingResponse)
async def update_setting(
    updated_setting: SettingCreate,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    setting = db.query(Setting).filter(Setting.key == updated_setting.key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
        
    if f"{updated_setting.key}" == "default_budget_amount" \
        and not re.fullmatch(r"^\d*\.?\d{0,2}$", updated_setting.value):
        raise HTTPException(status_code=401, detail="Setting must use price format")
    
    setting.value = f"{updated_setting.value}"
    
    setting.updated_at = datetime.now()
    db.commit()
    db.refresh(setting)
    
    return setting


# Budget summary endpoint
@app.get("/budget-summary/{month_year}", response_model=BudgetSummary)
async def get_budget_summary(
    month_year: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    # Get or create budget for the month
    budget = db.query(MonthlyBudget).filter(MonthlyBudget.month_year == month_year).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail=f"monthly_budget '{month_year}' doesn't exist.")
    else:
        # Recalculate budget amount if rollover setting changed
        # This ensures the budget reflects the current rollover setting
        budget_amount = budget.budget_amount
        
        if budget.rollover_enabled:
            rollover_amount = calculate_budget_rollover(db, month_year)
            budget_amount += rollover_amount
    
    # Calculate transactions for the month
    start_date = datetime.strptime(f"{month_year}-01", "%Y-%m-%d")
    if month_year.endswith("-12"):
        end_date = datetime.strptime(f"{month_year[:4]}-12-31", "%Y-%m-%d")
    else:
        year, month = month_year.split("-")
        next_month = f"{year}-{int(month)+1:02d}"
        end_date = datetime.strptime(f"{next_month}-01", "%Y-%m-%d")
    
    transactions = db.query(Transaction).filter(
        Transaction.timestamp >= start_date,
        Transaction.timestamp < end_date
    ).all()
    
    total_transactions = 0
    for t in transactions:
        if t.type == 'withdraw':
            total_transactions += t.amount
        else:
            total_transactions -= t.amount

    remaining_budget = budget.budget_amount - total_transactions
    is_over_budget = remaining_budget < 0
    
    return BudgetSummary(
        month_year=month_year,
        budget_amount=budget.budget_amount,
        total_transactions=total_transactions,
        remaining_budget=remaining_budget,
        is_over_budget=is_over_budget,
        rollover_enabled=budget.rollover_enabled
    )


if __name__ == "__main__":
    import uvicorn
    print(f" KEY:     {get_api_key()}")

    if DEV_MODE_ENABLED:
        uvicorn.run("main:app", host=HOST_IP, port=HOST_PORT, reload=True)
    else:
        uvicorn.run(app, host=HOST_IP, port=HOST_PORT)
