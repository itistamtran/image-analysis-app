import { Link } from "react-router-dom";

export default function PendingVerification() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gray-900">
            <div className="max-w-md text-center">
                <h1 className="mb-4 text-3xl font-bold text-cyan-400">
                    Verification Pending
                </h1>
                <p className="mb-6 text-gray-300">
                    Your account is currently under review. Once an administrator verifies
                    your license or hospital domain, you’ll be granted full access.
                </p>

                <p className="mb-8 text-sm text-gray-400">
                    You will receive an update in your account or by email when your
                    verification is complete.
                </p>

                <Link
                    to="/"
                    className="px-6 py-3 font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-700 hover:opacity-90"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
