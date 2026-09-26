import httpStatus from "http-status";
import AppError from "../../../../errors/AppError";
import { AuthRequest } from "../../../../middlewares/auth";
import catchAsync from "../../../../utils/catchAsync";
import sendResponse from "../../../../utils/sendResponse";
import { reportService } from "./report.service";

const today = () => new Date().toISOString().slice(0, 10);
const yearStart = () => `${new Date().getFullYear()}-01-01`;
const yearEnd = () => `${new Date().getFullYear()}-12-31`;

const invoiceAging = catchAsync(async (req: AuthRequest, res) => {
  const asOfDate = (req.query.as_of_date as string) || today();
  const data = await reportService.invoiceAgingDB(req.user!._id as string, asOfDate);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Invoice aging report retrieved successfully",
    data,
  });
});

const billAging = catchAsync(async (req: AuthRequest, res) => {
  const asOfDate = (req.query.as_of_date as string) || today();
  const data = await reportService.billAgingDB(req.user!._id as string, asOfDate);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Bill aging report retrieved successfully",
    data,
  });
});

const taxSummary = catchAsync(async (req: AuthRequest, res) => {
  const fromDate = (req.query.from_date as string) || yearStart();
  const toDate = (req.query.to_date as string) || yearEnd();
  const data = await reportService.taxSummaryDB(req.user!._id as string, fromDate, toDate);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tax summary report retrieved successfully",
    data,
  });
});

const customerBalance = catchAsync(async (req: AuthRequest, res) => {
  const asOfDate = (req.query.as_of_date as string) || today();
  const showZeroBalances = req.query.show_zero_balances === "true";
  const data = await reportService.customerBalanceDB(
    req.user!._id as string,
    asOfDate,
    showZeroBalances
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer balance report retrieved successfully",
    data,
  });
});

const vendorBalance = catchAsync(async (req: AuthRequest, res) => {
  const asOfDate = (req.query.as_of_date as string) || today();
  const showZeroBalances = req.query.show_zero_balances === "true";
  const data = await reportService.vendorBalanceDB(
    req.user!._id as string,
    asOfDate,
    showZeroBalances
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendor balance report retrieved successfully",
    data,
  });
});

const customerDetail = catchAsync(async (req: AuthRequest, res) => {
  const data = await reportService.customerDetailDB(
    req.user!._id as string,
    req.params.customerId,
    req.query.start_date as string | undefined,
    req.query.end_date as string | undefined
  );
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, "Customer not found");
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Customer detail report retrieved successfully",
    data,
  });
});

const vendorDetail = catchAsync(async (req: AuthRequest, res) => {
  const data = await reportService.vendorDetailDB(
    req.user!._id as string,
    req.params.vendorId,
    req.query.start_date as string | undefined,
    req.query.end_date as string | undefined
  );
  if (!data) {
    throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Vendor detail report retrieved successfully",
    data,
  });
});

const index = catchAsync(async (_req: AuthRequest, res) => {
  const year = new Date().getFullYear();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Account reports hub",
    data: {
      financialYear: {
        year_start_date: `${year}-01-01`,
        year_end_date: `${year}-12-31`,
      },
      availableReports: [
        "invoice-aging",
        "bill-aging",
        "tax-summary",
        "customer-balance",
        "vendor-balance",
      ],
    },
  });
});

const summary = catchAsync(async (req: AuthRequest, res) => {
  const data = await reportService.summaryDB(req.user!._id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Summary report retrieved successfully",
    data,
  });
});

const list = catchAsync(async (req: AuthRequest, res) => {
  const type = String(req.query.type ?? "");
  const data = await reportService.listReportDB(req.user!._id as string, type);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report retrieved successfully",
    data,
  });
});

export const reportController = {
  index,
  invoiceAging,
  billAging,
  taxSummary,
  customerBalance,
  vendorBalance,
  customerDetail,
  vendorDetail,
  summary,
  list,
};
