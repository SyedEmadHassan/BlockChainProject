// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title CampusGear - an auditable equipment lending register
/// @notice Physical handover and return inspection happen outside the blockchain.
contract CampusGear {
    enum Status { Available, Borrowed, ReturnRequested }

    struct Equipment {
        uint256 id;
        string name;
        address borrower;
        uint256 dueDate;
        Status status;
    }

    address public immutable administrator;
    uint256 public equipmentCount;
    uint256 public constant LOAN_DURATION = 7 days;
    mapping(uint256 => Equipment) private equipment;

    event EquipmentAdded(uint256 indexed id, string name);
    event EquipmentBorrowed(uint256 indexed id, address indexed borrower, uint256 dueDate);
    event ReturnRequested(uint256 indexed id, address indexed borrower);
    event ReturnConfirmed(uint256 indexed id, address indexed borrower);

    constructor() {
        administrator = msg.sender;
    }

    modifier onlyAdministrator() {
        require(msg.sender == administrator, "Only administrator");
        _;
    }

    modifier validEquipment(uint256 id) {
        require(id > 0 && id <= equipmentCount, "Equipment does not exist");
        _;
    }

    function addEquipment(string calldata name) external onlyAdministrator {
        bytes memory raw = bytes(name);
        require(raw.length > 0 && raw.length <= 100, "Name must be 1-100 bytes");
        bool hasContent;
        for (uint256 i = 0; i < raw.length; i++) {
            if (uint8(raw[i]) > 32) { hasContent = true; break; }
        }
        require(hasContent, "Name cannot be blank");
        uint256 id = ++equipmentCount;
        equipment[id] = Equipment(id, name, address(0), 0, Status.Available);
        emit EquipmentAdded(id, name);
    }

    function borrowEquipment(uint256 id) external validEquipment(id) {
        require(msg.sender != administrator, "Administrator cannot borrow");
        Equipment storage item = equipment[id];
        require(item.status == Status.Available, "Equipment is unavailable");
        item.borrower = msg.sender;
        item.dueDate = block.timestamp + LOAN_DURATION;
        item.status = Status.Borrowed;
        emit EquipmentBorrowed(id, msg.sender, item.dueDate);
    }

    function requestReturn(uint256 id) external validEquipment(id) {
        Equipment storage item = equipment[id];
        require(item.status == Status.Borrowed, "Equipment is not borrowed");
        require(item.borrower == msg.sender, "Only current borrower");
        item.status = Status.ReturnRequested;
        emit ReturnRequested(id, msg.sender);
    }

    function confirmReturn(uint256 id) external onlyAdministrator validEquipment(id) {
        Equipment storage item = equipment[id];
        require(item.status == Status.ReturnRequested, "Return has not been requested");
        address previousBorrower = item.borrower;
        item.borrower = address(0);
        item.dueDate = 0;
        item.status = Status.Available;
        emit ReturnConfirmed(id, previousBorrower);
    }

    function getEquipment(uint256 id) external view validEquipment(id) returns (Equipment memory) {
        return equipment[id];
    }
}
