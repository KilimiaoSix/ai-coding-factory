# 05 实现任务

## 任务列表

1. 建立 `TestEnvironmentConfig`
2. 建立 Backend 验证基座
3. 建立 Web 验证基座
4. 建立统一结果与证据模型

## 任务拆分

| 任务 | 输入 | 输出 |
| --- | --- | --- |
| `5.1` 实现环境配置模型 | 蓝图对象定义 | `TestEnvironmentConfig` |
| `5.2` 接入 Backend 验证 | 后端项目验证需求 | Backend 验证链路 |
| `5.3` 接入 Web 验证 | 浏览器自动化需求 | Web 验证链路 |
| `5.4` 统一结果模型 | Backend/Web 输出 | `VerificationRun` + `Evidence` |

## 完成定义

- 两类环境都可被配置
- 两类验证都能产生统一结果对象
- 证据可被后续 QA 和 Gate 消费
