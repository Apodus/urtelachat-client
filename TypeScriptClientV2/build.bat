@echo off

setlocal
setlocal ENABLEDELAYEDEXPANSION

set configFile=project.cfg
set versionFile=src/project.ts

set projectConfigured=
for /F "tokens=1-6 delims=," %%a in (%configFile%) do (
	if not defined projectConfigured (
		echo projectConfig!
		set projectName=%%a
		set projectVersionMajor=%%b
		set projectVersionMinor=%%c
		set projectBuild=%%d
		set projectCodeName=%%e
		set projectConfigured=true
	) else (
		echo Found Custom compile variable %%a to %%b
	)
)

IF [%1]==[] goto UPDATE_VERSION

IF [%1]==[+] goto UPDATE_BUILD_VERSION_MAJOR
goto UPDATE_BUILD_VERSION_MINOR

:UPDATE_BUILD_VERSION_MINOR
set /a projectVersionMinor=%projectVersionMinor%+1
goto UPDATE_VERSION

:UPDATE_BUILD_VERSION_MAJOR
set /a projectVersionMajor=%projectVersionMajor%+1
goto UPDATE_VERSION

:UPDATE_VERSION
set projectVersion=V.!projectVersionMajor!.!projectVersionMinor!

:UPDATE_BUILD
set projectDate=%DATE% %TIME%
set /a projectBuild=%projectBuild%+1

:WRITE_PROJECT_CONFIG
echo.
echo Write Config to %configFile%
echo %projectName%,%projectVersionMajor%,%projectVersionMinor%,%projectBuild%,%projectCodeName%,%projectDate%
echo %projectName%,%projectVersionMajor%,%projectVersionMinor%,%projectBuild%,%projectCodeName%,%projectDate%>%configFile%

:WRITE_BUILD_XML
echo class ProjectConfig>%versionFile%
echo {>>%versionFile%
echo 	name:string = "%projectName%";>>%versionFile%
echo 	codeName:string = "%projectCodeName%";>>%versionFile%
echo 	version:string = "%projectVersion%.%projectBuild%";>>%versionFile%
echo }>>%versionFile%
echo var Project:ProjectConfig = new ProjectConfig();>>%versionFile%

:INFO
echo.
echo ####################################################
echo #      Project Config                              #
echo ####################################################
echo.
echo Name:			%projectName%
echo Version:		%projectVersion%
echo Build:			%projectBuild%
echo CodeName:		%projectCodeName%
echo Date:			%projectDate%
echo ____________________________________________________
echo.

:COMPILE
echo compiling into javascript.
"%APPDATA%\npm\tsc.cmd" -p src\

:EXIT
echo  #### finished ####

endlocal