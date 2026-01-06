Ver 1.0.0: Hoàn thiện cơ bản các chức năng quản lý bệnh viện: Quản lý bệnh nhân, bác sĩ, lịch hẹn, khám bệnh, kê đơn thuốc, thanh toán hóa đơn.
# Hospital Management System - Backend
This is the backend implementation of a Hospital Management System using FastAPI and SQLAlchemy.
## Features
- Patient Management
- Doctor Management
- Appointment Scheduling
- Medical Examination and Diagnosis
- Prescription Management
- Billing and Invoicing
## Technologies Used
- FastAPI
- SQLAlchemy
- SQLite (for development; can be replaced with other databases)
- Pydantic
## Setup Instructions
1. Clone the repository:
    ```bash
    git clone
    cd hospital-backend
    ```
2. Create a virtual environment and activate it:
    ```bash
    python -m venv venv
    source venv/bin/activate # On Windows use `venv\Scripts\activate`
    ```
3. Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```
4. Run the FastAPI application:
    ```bash
    uvicorn main:app --reload
    ```
5. Access the API documentation at `http://localhost:8000/docs`
## API Endpoints
- `/patients/`: Manage patients
- `/doctors/`: Manage doctors
- `/appointments/`: Schedule and manage appointments
- `/visits/`: Handle medical examinations and diagnoses
- `/prescriptions/`: Manage prescriptions
- `/invoices/`: Handle billing and invoicing
## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.
## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details
