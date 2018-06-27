(function(){

    "use strict";

    const WORK_TIME_START = 9;
    const WORK_TIME_END = 17;
    const WORK_TIME_PER_DAY = WORK_TIME_END - WORK_TIME_START;

    const MILLISECONDS_TO_MINUTES = 1000 * 60;
    const HOURS_TO_MINUTES = 60;
    const WORK_TIME_IN_MINUTES = WORK_TIME_PER_DAY * 60;

    const FIRST_WORKDAY = 1;
    const LAST_WORKDAY = 5;

    const HTML_ELEMENT = document.getElementById('bug-reports');
    HTML_ELEMENT.innerHTML = '';

    const IsWorkingDay = (reportDate) => {
        return  reportDate.getDay() > 0 && reportDate.getDay() < 6
    };

    const IsInWorkingTime = (reportDate) => {
        return reportDate.getHours() >= WORK_TIME_START && reportDate.getHours() < WORK_TIME_END;
    };

    const GetNextWorkDay = (reportDate) => {

        if ( reportDate.getDay()+1 >= FIRST_WORKDAY && reportDate.getDay()+1 <= LAST_WORKDAY) {
            return (new Date(reportDate)).setDate(reportDate.getDate() + 1);
        }
        if ( reportDate.getDay() === 5 ){
            return (new Date(reportDate)).setDate(reportDate.getDate() + 3);
        }
        showError('Wrong date!' + reportDate.getDay() );

    };

    const CalculateTimeLeft = (startDate, timeInMinutes) => {

        let endDate =  new Date(startDate);
            endDate.setHours(WORK_TIME_END);
            endDate.setMinutes(0);

        let availableTime =  new Date(endDate - startDate).getTime();
        let availableMinutes = availableTime / MILLISECONDS_TO_MINUTES;

        return ( timeInMinutes > WORK_TIME_IN_MINUTES ) ? timeInMinutes - availableMinutes :  timeInMinutes ;
    };

    const showError = (message) => {
        console.error(message);
    };

    const validateData = (submitDate, turnAroundTime) => {

        try {
            submitDate = new Date(submitDate);
        }catch (e){
            throw 'Invalid date!';
        }

        if( submitDate instanceof Date === false ){
            return 'Invalid date!';
        }

        if( typeof turnAroundTime !== "number" ){
            return 'The second parameter must be integer!';
        }

        if ( turnAroundTime < 0 ){
            return 'Turn around time must be bigger than zero!';
        }

        if ( ! IsInWorkingTime(submitDate) || ! IsWorkingDay(submitDate) ){
            return 'Bug must be reported between 9AM - 5PM!';
        }

        return true;

    };

    const CalculateDueDate = (submitDate, turnAroundTime) => {

        let valid = validateData(submitDate, turnAroundTime);
        if ( ! valid ){
            console.log(valid);
            return valid;
        }

        let dueDate = new Date(submitDate);

        let turnAroundTimeInMinutes = turnAroundTime * HOURS_TO_MINUTES;

        let submitDateHours = submitDate.getHours();
        let submitDateMinutes = submitDate.getMinutes();

        let timeLeftOnSubmitDay = WORK_TIME_IN_MINUTES - (
            (submitDateHours * HOURS_TO_MINUTES + submitDateMinutes) - WORK_TIME_START * HOURS_TO_MINUTES);

        if ( timeLeftOnSubmitDay > turnAroundTimeInMinutes){
            dueDate.setMinutes( dueDate.getMinutes() + turnAroundTimeInMinutes );
        }
        else {

            turnAroundTimeInMinutes = turnAroundTimeInMinutes - timeLeftOnSubmitDay;

            while ( turnAroundTimeInMinutes > 0 ) {

                let nextWorkingDay = new Date(GetNextWorkDay(dueDate));
                    nextWorkingDay.setHours(WORK_TIME_START);
                    nextWorkingDay.setMinutes(0);

                dueDate = nextWorkingDay;

                if ( turnAroundTimeInMinutes < WORK_TIME_IN_MINUTES ) {

                    dueDate.setHours( WORK_TIME_START + turnAroundTimeInMinutes / 60);
                    dueDate.setMinutes( turnAroundTimeInMinutes % 60 );
                    turnAroundTimeInMinutes = 0;
                }

                if ( turnAroundTimeInMinutes !== 0 ){
                    turnAroundTimeInMinutes = CalculateTimeLeft(nextWorkingDay, turnAroundTimeInMinutes);
                }


            }

        }

        return dueDate;

    };

    const showTemplate = (data, error) => {

        let errorClass =  error.length > 0 ? 'error' : '';
        let hours = (data.turnAroundTime > 1 ) ? 'hours' : 'hour';

        HTML_ELEMENT.innerHTML += `
            <div class="report ${errorClass}">
                <div class="submit-date"><span class="title">Bug report date: </span>${data.submitDateString} ${data.submitTimeString}</div>
                <div class="due-date"><span class="title">Due date: </span>${data.dueDateString} ${data.dueTimeString}</div>
                <div class="turn-around-time"><span class="title">Turn around time: </span>${data.turnAroundTime + ' ' + hours} </div>
                <div class="errors">${error.join(' ')}</div>
            </div>
        `;

    };

    const formatDateString = (date) => {

        date = new Date(date);

        let month   = (date.getMonth() + 1);
        let day     = date.getDate();

        if ( month < 10 ) month = '0' + month;
        if ( day < 10 ) day = '0' + day;

        return date.getFullYear() + "-" + month + "-" + day;

    };

    const formatTimeString = (date) => {
        date = new Date(date);
        return  date.getHours() + ":" + date.getMinutes();
    };

    /** TEST CASES **/

    let testCases = [

        { submitDate: new Date("2018-06-27 15:22"), turnAroundTime: 16 },
        { submitDate: new Date("2018-06-21 11:28"), turnAroundTime: 3 },
        { submitDate: new Date("2018-06-21 16:28"), turnAroundTime: 1 },
        { submitDate: new Date("2018-06-21 9:20"),  turnAroundTime: 7 },
        { submitDate: new Date("2018-06-29 16:42"), turnAroundTime: 14 },
        { submitDate: new Date("2018-06-27 19:22"), turnAroundTime: 2 },
        { submitDate: new Date("2018-06-27 8:22"),  turnAroundTime: 28 },
        { submitDate: new Date("2018-06-27 15:22"), turnAroundTime: -4 },
        { submitDate: new Date("2018-06-27 16:42"), turnAroundTime: 0.5 },
        { submitDate: new Date("2018-06-27 16:22"), turnAroundTime: 1.5 },
        { submitDate: new Date("2018-06-27 16:22"), turnAroundTime: 49.5 },
        { submitDate: "2018-06-25 14:11",           turnAroundTime: 10 },
        { submitDate: "2:12PM",                     turnAroundTime: 5 },

    ];

    testCases.forEach((test) => {

        let submitDateString = '<span class="error-badge"> INVALID</span>';
        let submitTimeString = '<span class="error-badge"> INVALID</span>';
        let dueDateString    = '<span class="error-badge"> INVALID</span>';
        let dueTimeString    = '<span class="error-badge"> INVALID</span>';
        let error = [];

        let submitDate = new Date(test.submitDate);

        if ( submitDate instanceof Date === false || submitDate.toString() === 'Invalid Date') {
            error.push('Bug report date is not valid date!');
            submitDateString = '( ' + test.submitDate + ' ) ' + ' <span class="error-badge"> INVALID</span>' ;
        }else{

            submitDateString = formatDateString(submitDate);
            submitTimeString = formatTimeString(submitDate);

            let dueDate = CalculateDueDate(submitDate, test.turnAroundTime);

            if ( dueDate instanceof Date) {

                dueDateString = formatDateString(dueDate);
                dueTimeString = formatTimeString(dueDate);

            }else{
                error.push( dueDate );
            }


        }

        showTemplate({
            submitDateString,
            submitTimeString,
            dueDateString,
            dueTimeString,
            turnAroundTime: test.turnAroundTime
        }, error)


    });

})();