import { ArrowBack, ArrowBackSharp, Error } from '@mui/icons-material';

const ErrorPage = () => {
  return (
    <div className="bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Error className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Page Not Found
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="mt-4">
              <button
                onClick={() => window.history.back()}
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowBackSharp className="mr-2 h-3 w-3" aria-hidden="true" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;