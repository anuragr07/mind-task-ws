import { Request, Response, NextFunction } from "express";
import { CustomError, IResponseError } from "../utils/exceptions/customError";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
        console.error(err);
        if(!(err instanceof CustomError)) {
            res.status(500).send(
                JSON.stringify({ message: "Server Error. Please try again!" })
            )
        } else {
            const customError = err as CustomError;
            let response = { message: customError.message } as IResponseError
            if (customError.additionalInfo) response.additionalInfo = customError.additionalInfo;
            if (customError.stack) console.log(customError);
            res.status(customError.status).type('json').send(JSON.stringify(response))
        }
}