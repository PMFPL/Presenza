const httpStatus = require("http-status");
const { ObjectId } = require('mongodb')
const mongoose = require("mongoose");
const moment = require("moment");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendMail");
const { Leave, Employee, LeaveType, LeaveBalance, Attendance } = require('../models/index');

const createLeave = async (leaveData) => {
    try {
        return await Leave.create(leaveData);
    } catch (error) {
        throw new ApiError(httpStatus.status.INTERNAL_SERVER_ERROR, error.message);
    }
}
const createLeaveRequest = async (payload) => {
    console.log("Creating leave request with payload:", payload);

    const {
        employeeId,
        leaveType,
        startDate,
        endDate,
        reason,
        attachment,
    } = payload;

    /* ================= VALIDATION ================= */

    if (!leaveType) throw new Error("Leave type required");
    if (!startDate) throw new Error("Start date required");

    const employee = await Employee.findById(employeeId)
        .populate("reportingTo", "firstName lastName email");

    if (!employee) throw new Error("Employee not found");
    if (!employee.isActive) throw new Error("Employee inactive");

    /* ================= DATE HANDLING ================= */

    const start = new Date(`${startDate}T00:00:00.000Z`);

    let end = null;

    if (endDate) {
        const startDateObj = new Date(`${startDate}T00:00:00.000Z`);
        const endDateObj = new Date(`${endDate}T00:00:00.000Z`);

        if (startDateObj.getTime() !== endDateObj.getTime()) {
            end = new Date(`${endDate}T23:59:59.999Z`);
        }
    }

    if (end && start > end) {
        throw new Error("Start date cannot be after end date");
    }

    /* ================= HALF DAY VALIDATION ================= */

    if (
        leaveType === "FIRST_HALF" ||
        leaveType === "SECOND_HALF"
    ) {
        if (end) {
            throw new Error("Half day leave must be single day");
        }
    }

    /* ================= DUPLICATE LEAVE CHECK ================= */

    const existingLeave = await Leave.findOne({
        employee: employeeId,
        status: { $in: ["PENDING", "APPROVED"] },
        $or: [
            {
                startDate: { $lte: end || start },
                endDate: { $gte: start },
            },
            {
                startDate: start,
                endDate: null,
            },
        ],
    });

    if (existingLeave) {
        throw new Error("Leave already applied for selected dates");
    }

    /* ================= CREATE LEAVE ================= */

    console.log(
        `Creating leave for employee ${employeeId} from ${start.toISOString()} to ${
            end ? end.toISOString() : "single day"
        } with type ${leaveType}`
    );

    const leave = await Leave.create({
        employee: employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        attachment,
        status: "PENDING",
    });

    /* ================= SEND EMAIL TO REPORTING MANAGER ================= */

    const manager = employee.reportingTo;

    if (manager?.email) {
        const employeeName = [
            employee.fullName,
            // employee.lastName,
        ]
            .filter(Boolean)
            .join(" ");

        const managerName = [
            manager.fullName,
            // manager.lastName,
        ]
            .filter(Boolean)
            .join(" ");

        const formattedStartDate = start.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const formattedEndDate = end
            ? end.toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              })
            : null;

        const leaveDuration = formattedEndDate
            ? `${formattedStartDate} to ${formattedEndDate}`
            : formattedStartDate;

        const subject = `Leave Request - ${employeeName}`;

        const text = `
Hello ${managerName || "Manager"},

${employeeName} has submitted a new leave request.

Leave Type: ${leaveType}
Leave Date: ${leaveDuration}
Reason: ${reason || "Not provided"}
Status: Pending Approval

Please review the leave request from the Presenza system.

Regards,
Paul Presenza
        `.trim();

        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>New Leave Request</h2>

                <p>Hello ${managerName || "Manager"},</p>

                <p>
                    <strong>${employeeName}</strong> has submitted a new
                    leave request.
                </p>

                <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            <strong>Employee</strong>
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            ${employeeName}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            <strong>Leave Type</strong>
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            ${leaveType}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            <strong>Leave Date</strong>
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            ${leaveDuration}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            <strong>Reason</strong>
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            ${reason || "Not provided"}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            <strong>Status</strong>
                        </td>
                        <td style="padding: 8px; border: 1px solid #ddd;">
                            Pending Approval
                        </td>
                    </tr>
                </table>

                <p>
                    Please review this leave request from the Presenza system.
                </p>

                <p>
                    Regards,<br>
                    <strong>Paul Presenza</strong>
                </p>
            </div>
        `;

        try {
            await sendEmail(
                manager.email,
                subject,
                text,
                html
            );
        } catch (emailError) {
            // Leave is already created, so don't fail the request
            console.error(
                `Leave created successfully, but manager email failed for ${manager.email}:`,
                emailError.message
            );
        }
    } else {
        console.warn(
            `No reporting manager email found for employee ${employeeId}`
        );
    }

    return leave;
};
const getLeaves = async (filterQuery) => {
    try {
        return await Leave.aggregate([
            {
                '$match': filterQuery
            },
            {
                '$sort': {
                    'createdAt': -1
                }
            },
            {
                '$lookup': {
                    'from': 'employees',
                    'localField': 'employee',
                    'foreignField': '_id',
                    'as': 'emp'
                }
            },
            {
                '$unwind': {
                    'path': '$emp',
                    'preserveNullAndEmptyArrays': true
                }
            },
            {
                '$project': {
                    '_id': 1,
                    'startDate': 1,
                    'endDate': 1,
                    'leaveType': 1,
                    'reason': 1,
                    'status': 1,
                    'employeeCode': '$emp.employeeCode',
                    'employeeName': '$emp.fullName',
                    'rejectionReason': 1,
                    'leaveBalanceDeducted': 1
                }
            }
        ]);
    } catch (error) {
        throw new ApiError(httpStatus.status.INTERNAL_SERVER_ERROR, error.message);
    }
}
// const getLeaves = async (filterQuery) => {
//     try {
//         return await Leave.aggregate([
//             {
//                 '$match': filterQuery
//             }, {
//                 '$lookup': {
//                     'from': 'employees',
//                     'localField': 'employee',
//                     'foreignField': '_id',
//                     'as': 'emp'
//                 }
//             }, {
//                 '$unwind': {
//                     'path': '$emp',
//                     'preserveNullAndEmptyArrays': true
//                 }
//             }, {
//                 '$project': {
//                     '_id': 1,
//                     'startDate': 1,
//                     'endDate': 1,
//                     'leaveType': 1,
//                     'reason': 1,
//                     'status': 1,
//                     'employeeCode': '$emp.employeeCode',
//                     'employeeName': '$emp.fullName',
//                     "rejectionReason": 1,
//                     "leaveBalanceDeducted": 1
//                 }
//             }
//         ]);
//     } catch (error) {
//         throw new ApiError(httpStatus.status.INTERNAL_SERVER_ERROR, error.message);
//     }
// }
const approveLeave = async (leaveId, approverId) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const leave = await Leave.findById(leaveId).session(session);

        if (!leave) {
            throw new Error("Leave not found");
        }

        if (leave.status === "APPROVED") {
            throw new Error("Leave already approved");
        }

        const { employee, startDate, endDate, leaveType } = leave;

        // =====================================================
        // HANDLE SINGLE DAY LEAVE (endDate is null)
        // =====================================================
        const effectiveEndDate = endDate || startDate;

        let current = new Date(
            new Date(startDate).toISOString().split("T")[0]
        );

        const finalDate = new Date(
            new Date(effectiveEndDate).toISOString().split("T")[0]
        );

        // Check if it's a short leave
        const isShortLeave =
            leaveType === "FIRST_HALF_SHORT_LEAVE" ||
            leaveType === "SECOND_HALF_SHORT_LEAVE";
            
        // Check if it's a half-day leave (full leave but half day)
        const isHalfDayLeave =
            leaveType === "FIRST_HALF" ||
            leaveType === "SECOND_HALF";

        // =====================================================
        // CHECK IF LEAVE ALREADY DEDUCTED BY CRON
        // =====================================================
        if (leave.status === "PENDING" && leave.leaveBalanceDeducted === true) {
            console.log(`✅ Leave ${leave._id} already deducted by cron. Just approving...`);

            leave.status = "APPROVED";
            leave.approvedBy = approverId;
            leave.approvedAt = new Date();

            await leave.save({ session });

            await session.commitTransaction();

            console.log(`✅ Leave ${leave._id} approved.`);

            return leave;
        }

        // =====================================================
        // CASE 2: LEAVE DEDUCTION NEEDED
        // =====================================================

        // Determine leave type code
        let leaveTypeCode = isShortLeave ? "SL" : "EL";

        const leaveTypeDoc = await LeaveType.findOne({
            code: leaveTypeCode
        }).session(session);

        if (!leaveTypeDoc) {
            throw new Error("Leave type not found");
        }

        // Full day = 1, Half day = 0.5
        let deduction = 1;

        if (
            leaveType === "FIRST_HALF" ||
            leaveType === "SECOND_HALF" ||
            leaveType === "FIRST_HALF_SHORT_LEAVE" ||
            leaveType === "SECOND_HALF_SHORT_LEAVE"
        ) {
            deduction = 0.5;
        }

        // =====================================================
        // TRACK DEDUCTIONS FOR LOGGING
        // =====================================================
        let totalDeducted = 0;
        let totalLOP = 0;
        let daysProcessed = 0;
        let daysSkippedAlreadyDeducted = 0;

        let currentDate = new Date(current);

        // =====================================================
        // HELPER FUNCTION: Get previous months' EL balances only
        // =====================================================
        const getPreviousMonthsELBalances = async (employeeId, leaveTypeId, currentMonth, currentYear, maxMonths = 12) => {
            const previousBalances = [];

            // Check up to maxMonths previous months
            for (let i = 1; i <= maxMonths; i++) {
                let prevMonth = currentMonth - i;
                let prevYear = currentYear;

                if (prevMonth <= 0) {
                    prevMonth += 12;
                    prevYear -= 1;
                }

                // Skip if previous year (only current year)
                if (prevYear < currentYear) {
                    continue;
                }

                const balance = await LeaveBalance.findOne({
                    employeeId: employeeId,
                    leaveTypeId: leaveTypeId,
                    month: prevMonth,
                    year: prevYear
                }).session(session);

                if (balance && balance.remaining > 0) {
                    previousBalances.push({
                        balance: balance,
                        month: prevMonth,
                        year: prevYear,
                        remaining: balance.remaining
                    });
                }
            }

            // Sort by month (most recent first)
            previousBalances.sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });

            return previousBalances;
        };

        while (currentDate <= finalDate) {

            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const dayOfMonth = currentDate.getDate();

            console.log(`  Processing date: ${currentDate.toISOString().split("T")[0]}`);

            // =====================================================
            // SHORT LEAVE LOGIC
            // SL -> EL(0.5) from current month -> EL from previous months -> LOP(0.5)
            // NOTE: SL doesn't carry forward to next month, so we only check current month's SL
            // =====================================================
            if (isShortLeave) {

                const shortLeaveBalance = await LeaveBalance.findOne({
                    employeeId: employee,
                    leaveTypeId: leaveTypeDoc._id,
                    month,
                    year
                }).session(session);

                if (!shortLeaveBalance) {
                    throw new Error(
                        `Short leave balance not found for month ${month} year ${year}`
                    );
                }

                // Also need the EL balance doc to check its deductedDays in case
                // a previous run fell back to EL for this same day.
                const earnedLeaveTypeCheck = await LeaveType.findOne({ code: "EL" }).session(session);
                const earnedLeaveBalanceCheck = earnedLeaveTypeCheck
                    ? await LeaveBalance.findOne({
                        employeeId: employee,
                        leaveTypeId: earnedLeaveTypeCheck._id,
                        month,
                        year
                    }).session(session)
                    : null;

                // =====================================================
                // CHECK: Is this day already deducted (SL or fallback EL)?
                // =====================================================
                const alreadyOnSL = shortLeaveBalance.deductedDays && shortLeaveBalance.deductedDays.includes(dayOfMonth);
                const alreadyOnEL = earnedLeaveBalanceCheck && earnedLeaveBalanceCheck.deductedDays && earnedLeaveBalanceCheck.deductedDays.includes(dayOfMonth);

                if (alreadyOnSL || alreadyOnEL) {
                    console.log(`    ℹ️ Day ${dayOfMonth} (${month}/${year}) already deducted. Skipping.`);
                    daysSkippedAlreadyDeducted++;
                    daysProcessed++;
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                // Use available short leave first (only current month, SL doesn't carry forward)
                if (shortLeaveBalance.remaining > 0) {

                    shortLeaveBalance.used += 1;
                    shortLeaveBalance.remaining -= 1;
                    totalDeducted += 1;

                    // Mark this day as deducted on the SL balance
                    shortLeaveBalance.deductedDays = shortLeaveBalance.deductedDays || [];
                    shortLeaveBalance.deductedDays.push(dayOfMonth);

                    console.log(`    ✅ Used 1 SL from current month (remaining: ${shortLeaveBalance.remaining})`);
                    await shortLeaveBalance.save({ session });

                } else {

                    // Short leave exhausted -> deduct 0.5 EL
                    const earnedLeaveType = await LeaveType.findOne({
                        code: "EL"
                    }).session(session);

                    if (!earnedLeaveType) {
                        throw new Error("Earned leave type not found");
                    }

                    const earnedLeaveBalance = await LeaveBalance.findOne({
                        employeeId: employee,
                        leaveTypeId: earnedLeaveType._id,
                        month,
                        year
                    }).session(session);

                    if (!earnedLeaveBalance) {
                        throw new Error(
                            `Earned leave balance not found for month ${month} year ${year}`
                        );
                    }

                    const elDeduction = 0.5;
                    let remainingToDeduct = elDeduction;

                    // First try current month's EL balance
                    if (earnedLeaveBalance.remaining >= remainingToDeduct) {

                        earnedLeaveBalance.used += remainingToDeduct;
                        earnedLeaveBalance.remaining -= remainingToDeduct;
                        totalDeducted += remainingToDeduct;
                        remainingToDeduct = 0;

                        console.log(`    ✅ Used ${remainingToDeduct} EL from current month (remaining: ${earnedLeaveBalance.remaining})`);
                        await earnedLeaveBalance.save({ session });

                    } else if (earnedLeaveBalance.remaining > 0) {
                        // Use what's available in current month
                        const availableEL = earnedLeaveBalance.remaining;
                        earnedLeaveBalance.used += availableEL;
                        earnedLeaveBalance.remaining = 0;
                        totalDeducted += availableEL;
                        remainingToDeduct -= availableEL;

                        console.log(`    ✅ Used ${availableEL} EL from current month (remaining: 0)`);
                        await earnedLeaveBalance.save({ session });
                    }

                    // If still need to deduct, check previous months' EL (SL doesn't carry forward)
                    if (remainingToDeduct > 0) {
                        const previousBalances = await getPreviousMonthsELBalances(
                            employee,
                            earnedLeaveType._id,
                            month,
                            year
                        );

                        for (const prevBalance of previousBalances) {
                            if (remainingToDeduct <= 0) break;

                            const availableFromPrev = Math.min(prevBalance.remaining, remainingToDeduct);

                            if (availableFromPrev > 0) {
                                prevBalance.balance.used += availableFromPrev;
                                prevBalance.balance.remaining -= availableFromPrev;
                                totalDeducted += availableFromPrev;
                                remainingToDeduct -= availableFromPrev;

                                console.log(`    ✅ Used ${availableFromPrev} EL from ${prevBalance.month}/${prevBalance.year} (remaining: ${prevBalance.balance.remaining})`);
                                await prevBalance.balance.save({ session });
                            }
                        }
                    }

                    // If still remaining, convert to LOP
                    if (remainingToDeduct > 0) {
                        // Update current month's LOP
                        earnedLeaveBalance.lop += remainingToDeduct;
                        totalLOP += remainingToDeduct;
                        console.log(`    ⚠️ LOP: ${remainingToDeduct} days (no EL balance in current or previous months)`);
                    }

                    // Mark this day as deducted on the current month's EL balance
                    earnedLeaveBalance.deductedDays = earnedLeaveBalance.deductedDays || [];
                    earnedLeaveBalance.deductedDays.push(dayOfMonth);

                    await earnedLeaveBalance.save({ session });
                }

            }
            // =====================================================
            // NORMAL EL LEAVE LOGIC
            // FULL DAY => 1
            // HALF DAY => 0.5
            // Check current month -> Previous months -> LOP
            // =====================================================
            else {

                const balance = await LeaveBalance.findOne({
                    employeeId: employee,
                    leaveTypeId: leaveTypeDoc._id,
                    month,
                    year
                }).session(session);

                if (!balance) {
                    throw new Error(
                        `Leave balance not found for month ${month} year ${year}`
                    );
                }

                // =====================================================
                // CHECK: Is this day already deducted?
                // =====================================================
                if (balance.deductedDays && balance.deductedDays.includes(dayOfMonth)) {
                    console.log(`    ℹ️ Day ${dayOfMonth} (${month}/${year}) already deducted. Skipping.`);
                    daysSkippedAlreadyDeducted++;
                    daysProcessed++;
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                let remainingToDeduct = deduction;

                // First try current month's balance
                if (balance.remaining >= remainingToDeduct) {

                    balance.used += remainingToDeduct;
                    balance.remaining -= remainingToDeduct;
                    totalDeducted += remainingToDeduct;
                    remainingToDeduct = 0;

                    console.log(`    ✅ Used ${remainingToDeduct} ${leaveTypeCode} from current month (remaining: ${balance.remaining})`);

                } else if (balance.remaining > 0) {
                    // Use what's available in current month
                    const availableLeave = balance.remaining;
                    balance.used += availableLeave;
                    balance.remaining = 0;
                    totalDeducted += availableLeave;
                    remainingToDeduct -= availableLeave;

                    console.log(`    ✅ Used ${availableLeave} ${leaveTypeCode} from current month (remaining: 0)`);
                }

                // If still need to deduct, check previous months
                if (remainingToDeduct > 0) {
                    const previousBalances = await getPreviousMonthsELBalances(
                        employee,
                        leaveTypeDoc._id,
                        month,
                        year
                    );

                    for (const prevBalance of previousBalances) {
                        if (remainingToDeduct <= 0) break;

                        const availableFromPrev = Math.min(prevBalance.remaining, remainingToDeduct);

                        if (availableFromPrev > 0) {
                            prevBalance.balance.used += availableFromPrev;
                            prevBalance.balance.remaining -= availableFromPrev;
                            totalDeducted += availableFromPrev;
                            remainingToDeduct -= availableFromPrev;

                            console.log(`    ✅ Used ${availableFromPrev} ${leaveTypeCode} from ${prevBalance.month}/${prevBalance.year} (remaining: ${prevBalance.balance.remaining})`);
                            await prevBalance.balance.save({ session });
                        }
                    }
                }

                // If still remaining, convert to LOP
                if (remainingToDeduct > 0) {
                    balance.lop += remainingToDeduct;
                    totalLOP += remainingToDeduct;
                    console.log(`    ⚠️ LOP: ${remainingToDeduct} days (no ${leaveTypeCode} balance in current or previous months)`);
                }

                // Mark this day as deducted on the current month's balance
                balance.deductedDays = balance.deductedDays || [];
                balance.deductedDays.push(dayOfMonth);

                await balance.save({ session });
            }

            daysProcessed++;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // =====================================================
        // MARK AS DEDUCTED AND APPROVE
        // =====================================================
        leave.leaveBalanceDeducted = true;
        leave.status = "APPROVED";
        leave.approvedBy = approverId;
        leave.approvedAt = new Date();

        await leave.save({ session });

        await session.commitTransaction();

        console.log(`✅ Leave ${leave._id} approved and deducted:`);
        console.log(`   Total Deducted: ${totalDeducted}`);
        console.log(`   Total LOP: ${totalLOP}`);
        console.log(`   Days Processed: ${daysProcessed}`);
        console.log(`   Days Skipped (Already Deducted): ${daysSkippedAlreadyDeducted}`);

        return leave;

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ Error in approveLeave:", error.message);
        throw error;
    } finally {
        await session.endSession();
    }
};

const rejectLeave = async (leaveId, rejectionReason) => {
    try {
        return Leave.findOneAndUpdate({ _id: new ObjectId(leaveId) }, { status: "REJECTED", rejectionReason: rejectionReason }, { new: true });
    } catch (error) {
        throw new ApiError(httpStatus.status.INTERNAL_SERVER_ERROR, error.message)
    }
}
module.exports = {
    createLeave,
    createLeaveRequest,
    getLeaves,
    approveLeave,
    rejectLeave
}