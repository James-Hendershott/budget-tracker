-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Person" AS ENUM ('JAMES', 'SAVANAH');

-- CreateEnum
CREATE TYPE "Owner" AS ENUM ('JAMES', 'SAVANAH', 'EITHER', 'TOGETHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('REQUIRED', 'IMPORTANT', 'REVIEW', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PLANNED', 'PENDING', 'PAID', 'REVIEW', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BillCategory" AS ENUM ('HOUSING', 'UTILITIES', 'INSURANCE', 'INTERNET', 'SUBSCRIPTION', 'MEDICAL', 'PRESCRIPTION', 'STUDENT_LOAN', 'PERSONAL_LOAN', 'CREDIT_CARD', 'GROCERIES', 'GAS', 'ONE_TIME', 'OTHER');

-- CreateEnum
CREATE TYPE "HousingLineItem" AS ENUM ('RENT', 'MTM_FEE', 'WATER', 'SEWER', 'GAS', 'ELECTRIC', 'FEES', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('CREDIT_CARD', 'INSTALLMENT', 'SIGNATURE_LOAN', 'STUDENT_LOAN', 'MEDICAL_PLAN', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtStrategy" AS ENUM ('MINIMUM_ONLY', 'AVALANCHE', 'SNOWBALL', 'CONSOLIDATION_CANDIDATE', 'HOLD');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('MOVE_FUND', 'DOWN_PAYMENT', 'EMERGENCY_FUND', 'HSA_FSA', 'DEBT_PAYOFF');

-- CreateEnum
CREATE TYPE "SyncSource" AS ENUM ('APP', 'SHEET');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" "Person" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_bills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BillCategory" NOT NULL,
    "priority" "Priority" NOT NULL,
    "defaultAmount" DECIMAL(10,2) NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "autopay" BOOLEAN NOT NULL DEFAULT false,
    "owner" "Owner" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_instances" (
    "id" TEXT NOT NULL,
    "recurringBillId" TEXT,
    "month" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BillCategory" NOT NULL,
    "priority" "Priority" NOT NULL,
    "plannedAmount" DECIMAL(10,2) NOT NULL,
    "actualAmount" DECIMAL(10,2),
    "dueDay" INTEGER NOT NULL,
    "autopay" BOOLEAN NOT NULL,
    "owner" "Owner" NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "source" "SyncSource" NOT NULL DEFAULT 'APP',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bill_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing_targets" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing_payments" (
    "id" TEXT NOT NULL,
    "housingTargetId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "paidBy" "Person" NOT NULL,
    "appliedTo" "HousingLineItem" NOT NULL,
    "notes" TEXT,
    "source" "SyncSource" NOT NULL DEFAULT 'APP',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_entries" (
    "id" TEXT NOT NULL,
    "person" "Person" NOT NULL,
    "expectedAmount" DECIMAL(10,2) NOT NULL,
    "actualAmount" DECIMAL(10,2),
    "payDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "notes" TEXT,
    "source" "SyncSource" NOT NULL DEFAULT 'APP',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "merchant" TEXT,
    "paidBy" "Person" NOT NULL,
    "paymentMethod" TEXT,
    "countsTowardBudget" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "source" "SyncSource" NOT NULL DEFAULT 'APP',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lender" TEXT NOT NULL,
    "debtType" "DebtType" NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "payoffAmount" DECIMAL(10,2),
    "apr" DECIMAL(5,2),
    "minimumPayment" DECIMAL(10,2) NOT NULL,
    "dueDay" INTEGER,
    "includeInPayoffPlan" BOOLEAN NOT NULL DEFAULT true,
    "strategy" "DebtStrategy" NOT NULL DEFAULT 'MINIMUM_ONLY',
    "notes" TEXT,
    "source" "SyncSource" NOT NULL DEFAULT 'APP',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(10,2) NOT NULL,
    "currentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assumptions" JSONB NOT NULL,
    "createdBy" "Person" NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_conflicts" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "appVersion" JSONB NOT NULL,
    "sheetVersion" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "bill_instances_month_idx" ON "bill_instances"("month");

-- CreateIndex
CREATE UNIQUE INDEX "housing_targets_month_key" ON "housing_targets"("month");

-- CreateIndex
CREATE INDEX "income_entries_payDate_idx" ON "income_entries"("payDate");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- AddForeignKey
ALTER TABLE "bill_instances" ADD CONSTRAINT "bill_instances_recurringBillId_fkey" FOREIGN KEY ("recurringBillId") REFERENCES "recurring_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing_payments" ADD CONSTRAINT "housing_payments_housingTargetId_fkey" FOREIGN KEY ("housingTargetId") REFERENCES "housing_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
