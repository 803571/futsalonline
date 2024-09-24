import Singleton from "./singleton.js";

class PortUtil extends Singleton {
  constructor() {
    super();
    
    // 인스턴스가 처음 생성될 때만 초기화
    if (!this.initialized) {
      this.init();
      this.initialized = true;
    }
  }

  init() {
    this.gamePorts = [4444, 4445, 4446];
    this.portStatus = { 4444: 0, 4445: 0, 4446: 0 };
  }

  /**
   * 포트 사용 가능 여부 함수
   * @return {number} port - 사용 가능 포트
   */
  findAvailablePort() {
    if (!this.gamePorts) {
      throw new Error("gamePorts 배열이 초기화되지 않았습니다.");
    }
    
    for (const port of this.gamePorts) {
      if (this.portStatus[port] < 2) {
        return port;
      }
    }

    return null;
  }

  /**
   * 포트 사용 Set 함수
   * @param {number} port - 포트
   * @param {number} status - 플레이어 인원
   */
  setPortStatus(port, status) {
    if (this.portStatus[port] !== undefined) {
      console.log(`Before setPortStatus(${port}, ${status}):`, this.getPortStatus());
      this.portStatus[port] = status;
      console.log(`After setPortStatus(${port}, ${status}):`, this.getPortStatus());
    }
  }

  /**
   * 포트 사용 Get 함수
   * @return {object} portStatus - 포트 사용 여부
   */
  getPortStatus() {
    return this.portStatus;
  }
}

const portUtil = new PortUtil();
export default portUtil;