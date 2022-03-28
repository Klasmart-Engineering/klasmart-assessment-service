select 
  ucs.room_id, 
  ucs.student_id,
  ucs.content_id,
  a.score,
  a.timestamp_epoch
from assessment_xapi_user_content_score as ucs
join assessment_xapi_answer as a
  on ucs.room_id = a.room_id
  and ucs.student_id = a.student_id
  and ucs.content_id = a.content_id
where ucs.room_id = 'room0'
  and ucs.student_id = 'user0'
  and ucs.content_id = 'h5pId0';
