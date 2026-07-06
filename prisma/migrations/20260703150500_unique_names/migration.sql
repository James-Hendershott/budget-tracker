-- CreateIndex
CREATE UNIQUE INDEX "debts_name_lender_key" ON "debts"("name", "lender");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_bills_name_key" ON "recurring_bills"("name");

